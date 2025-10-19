"""
Author: Bruce Chen <bruce.chen@effem.com>
Date: 2025-08-29

Copyright (c) 2025 Mars Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

# Module: routes (add admin APIs)
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, UploadFile, File
from models import *
from file_service import FileService
from query_service import QueryService
from streaming_service import StreamingService
import logging
from fastapi.responses import FileResponse
import os
import csv 
from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
import re
import shutil
from auth import (
    get_user_by_username,
    verify_password,
    create_access_token,
    decode_token,
    require_admin,
    list_users as auth_list_users,
    create_user as auth_create_user,
    update_user as auth_update_user,
    delete_user as auth_delete_user,
    get_config as auth_get_config,
    update_config as auth_update_config,
    count_users as auth_count_users,
    get_signup_whitelist,
    get_prompts as auth_get_prompts,
    update_prompts as auth_update_prompts,
    list_model_overrides as auth_list_model_overrides,
    get_model_details_override as auth_get_model_override,
    update_model_details_override as auth_update_model_override,
    delete_model_details_override as auth_delete_model_override,
)
from token_utils import normalize_model_name

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload/", response_model=ExcelData)
async def upload_file(file: UploadFile = File(...)):
    return await FileService.process_excel_file(file)

@router.post("/upload-pdf/", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    return await FileService.process_pdf_file(file)

@router.post("/query/", response_model=QueryResponse)
async def query_knowledge_base(request: QueryRequest):
    return QueryService.single_query(request)

@router.post("/batch-query-stream/")
async def batch_query_stream(request: BatchQueryRequest):
    return await StreamingService.batch_query_stream(request)

@router.post("/batch-query/", response_model=BatchQueryResponse)
async def batch_query_knowledge_base(request: BatchQueryRequest):
    return QueryService.batch_query(request)

@router.post("/stop-retry/")
async def stop_retry():
    return StreamingService.stop_retry()

@router.post("/retry-failed-stream/")
async def retry_failed_records_stream(request: RetryFailedRequest):
    return await StreamingService.retry_failed_stream(request)

@router.get("/test/")
async def test_route():
    logger.info("Test route accessed")
    return {"message": "API service is running normally"}


@router.get("/download-excel/{session_id}")
async def download_excel_by_session(session_id: str, background_tasks: BackgroundTasks, filename: str = None):
    """Download the Excel file directly by session ID"""
    try:
        # Get data from cache
        cached_data = StreamingService.get_cached_data(session_id)
        
        if not cached_data:
            raise HTTPException(status_code=404, detail="Session data not found or expired")
        
        data = cached_data["data"]
        statistics = cached_data["statistics"]
        
        if not data:
            raise HTTPException(status_code=400, detail="No data available for download")
        
        # Generate file name
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f'audit_results_{timestamp}.xlsx'
        
        logger.info(f"Generating Excel for session {session_id}, {len(data)} records")
        
        # Generate Excel file
        temp_file_path = FileService.generate_excel_from_cache(data, filename, statistics)
        
        # Add a background task to clean up the temporary file
        background_tasks.add_task(lambda: os.unlink(temp_file_path) if os.path.exists(temp_file_path) else None)
        
        # Return file
        return FileResponse(
            path=temp_file_path,
            filename=filename,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Excel download failed for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Excel download failed: {str(e)}")

@router.get("/cache-status/{session_id}")
async def get_cache_status(session_id: str):
    """Check the status of cached data"""
    cached_data = StreamingService.get_cached_data(session_id)
    
    if not cached_data:
        return {"exists": False, "message": "Session data not found or expired"}
    
    return {
        "exists": True,
        "data_count": len(cached_data["data"]),
        "statistics": cached_data["statistics"],
        "timestamp": cached_data["timestamp"].isoformat(),
        "expires_at": cached_data["expires_at"].isoformat()
    }

@router.post("/cleanup-cache")
async def cleanup_expired_cache():
    """Manually clean up expired cache"""
    cleaned_count = StreamingService.cleanup_expired_cache()
    return {"message": f"Cleaned {cleaned_count} expired cache entries"}


class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/login")
async def login(req: LoginRequest):
    """
    Admin/User login to get JWT token.
    """
    user = get_user_by_username(req.username)
    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(req.password, user["password_salt"], user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(user_id=user["id"], username=user["username"], role=user["role"])
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}

# -------- Admin: Users --------
class AdminCreateUser(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=6)
    role: Literal["admin", "user"] = "user"
    is_active: bool = True

class AdminUpdateUser(BaseModel):
    password: Optional[str] = Field(default=None, min_length=6)
    role: Optional[Literal["admin", "user"]] = None
    is_active: Optional[bool] = None

@router.get("/admin/users")
async def admin_list_users(request: Request):
    require_admin(request)
    users = auth_list_users()
    return {"users": users}

@router.post("/admin/users")
async def admin_create_user(request: Request, body: AdminCreateUser):
    require_admin(request)
    if get_user_by_username(body.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    user_id = auth_create_user(body.username, body.password, role=body.role, is_active=body.is_active)
    return {"id": user_id, "username": body.username, "role": body.role, "is_active": body.is_active}

@router.patch("/admin/users/{user_id}")
async def admin_update_user(request: Request, user_id: int, body: AdminUpdateUser):
    require_admin(request)
    try:
        auth_update_user(user_id, password=body.password, role=body.role, is_active=body.is_active)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"success": True}

@router.delete("/admin/users/{user_id}")
async def admin_delete_user(request: Request, user_id: int):
    require_admin(request)
    auth_delete_user(user_id)
    return {"success": True}

# -------- Admin: Config --------
class ConfigModel(BaseModel):
    temperature: float
    model: str
    pricing_model: str

class ConfigUpdate(BaseModel):
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    model: Optional[str] = None
    pricing_model: Optional[str] = None

@router.get("/admin/config", response_model=ConfigModel)
async def admin_get_config(request: Request):
    require_admin(request)
    cfg = auth_get_config()
    return ConfigModel(**cfg)

@router.put("/admin/config", response_model=ConfigModel)
async def admin_update_config(request: Request, body: ConfigUpdate):
    require_admin(request)
    cfg = auth_update_config(temperature=body.temperature, model=body.model, pricing_model=body.pricing_model)
    # Synchronize PRICING_FILE environment variable (affects token_utils billing)
    try:
        resolved = _resolve_pricing_file(cfg.get("pricing_model"))
        if resolved:
            # Ensure the pricing CSV exists (generate if missing)
            _ensure_pricing_csv(resolved)

            os.environ["PRICING_FILE"] = resolved
            logger.info(f"PRICING_FILE set to: {resolved}")
        else:
            # After clearing, it falls back to the default mapping/pricing_model.csv in token_utils
            if "PRICING_FILE" in os.environ:
                os.environ.pop("PRICING_FILE", None)
                logger.info("PRICING_FILE cleared (use default mapping/pricing_model.csv)")
    except Exception as e:
        logger.warning(f"Failed to set PRICING_FILE for pricing_model={cfg.get('pricing_model')}: {e}")
    return ConfigModel(**cfg)

# Read CSV as a generic table (returns columns and rows)
def _read_csv_as_table(file_path: str) -> Dict[str, Any]:
    if not os.path.isfile(file_path):
        raise FileNotFoundError(file_path)
    with open(file_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        rows: List[Dict[str, Any]] = []
        for row in reader:
            # Trim leading/trailing whitespace, and keep TRUE/FALSE as original values (frontend displays them as text)
            cleaned: Dict[str, Any] = {}
            for k in columns:
                v = row.get(k, "")
                if isinstance(v, str):
                    v = v.strip()
                cleaned[k] = v
            rows.append(cleaned)
    return {"columns": columns, "rows": rows}

@router.get("/admin/model-catalog")
async def admin_model_catalog(request: Request, source: Optional[str] = None):
    require_admin(request)
    try:
        # Parse file path (supports preset names), reusing existing parsing rules
        cfg = auth_get_config()
        prefer = source or (cfg.get("pricing_model") or "").strip()

        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_default = os.path.join(project_root, "mapping", "pricing_model.csv")
        cwd_default = os.path.abspath(os.path.join(os.getcwd(), "mapping", "pricing_model.csv"))

        candidates = []
        if prefer:
            try:
                prefer_path = _resolve_pricing_file(prefer)
                if prefer_path:
                    candidates.append(os.path.abspath(prefer_path))
            except Exception:
                pass
        # Always use "project root's mapping/pricing_model.csv" as the primary fallback
        candidates.append(os.path.abspath(project_default))
        # Compatibility fallback: mapping under CWD (if someone starts from the src directory)
        candidates.append(os.path.abspath(cwd_default))

        resolved = next((p for p in candidates if os.path.isfile(p)), None)
        if not resolved:
            raise HTTPException(
                status_code=404,
                detail=f"CSV not found. Tried: {candidates}"
            )
        logger.info(f"[model-catalog] Using CSV: {resolved}")
        table = _read_csv_as_table(resolved)
        overrides = auth_list_model_overrides()
        columns = list(table["columns"] or [])
        name_col = next((c for c in columns if re.match(r'^(model\s*name|model)$', c.strip(), re.I)), None) or "Model Name"
        override_keys = set()
        for ov in overrides.values():
            override_keys.update(ov.keys())
        union_cols = list(sorted(set(columns) | override_keys | {name_col}))

        rows_by_name: Dict[str, Dict[str, Any]] = {}
        for row in table["rows"]:
            name = str(row.get(name_col, "")).strip()
            merged = {**row}
            if name in overrides:
                merged.update(overrides[name])
            rows_by_name[name] = merged

        for name, ov in overrides.items():
            if name not in rows_by_name:
                base = {c: "" for c in union_cols}
                base[name_col] = name
                base.update(ov)
                rows_by_name[name] = base

        merged_rows = list(rows_by_name.values())
        return {"columns": union_cols, "rows": merged_rows, "file": resolved}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model catalog: {e}")

# -------- Admin: Token & Cost Metrics --------
def _iter_token_usage_lines() -> List[str]:
    token_dir = os.path.join(os.path.dirname(__file__), "token")
    if not os.path.isdir(token_dir):
        return []
    lines: List[str] = []
    for name in os.listdir(token_dir):
        if name.endswith(".txt"):
            path = os.path.join(token_dir, name)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    lines.extend(f.readlines())
            except Exception:
                continue
    return lines

TOKEN_LINE_RE = re.compile(
    r"Timestamp:\s*(?P<ts>[\d\-:\s]+),\s*Model:\s*(?P<model>[^,]+),\s*Input Tokens:\s*(?P<input>\d+),\s*Output Tokens:\s*(?P<output>\d+).*Total Cost:\s*\$(?P<total>[0-9.]+)"
)

def _parse_ts(ts: str) -> Optional[datetime]:
    try:
        return datetime.strptime(ts.strip(), "%Y-%m-%d %H:%M:%S")
    except Exception:
        return None

@router.get("/admin/metrics/tokens")
async def admin_metrics_tokens(
    request: Request,
    date_from: Optional[str] = None,  # YYYY-MM-DD
    date_to: Optional[str] = None,    # YYYY-MM-DD
    group_by: Optional[Literal["date", "model"]] = "date",
):
    require_admin(request)

    dt_from: Optional[date] = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    dt_to: Optional[date] = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None

    lines = _iter_token_usage_lines()
    entries: List[Dict[str, Any]] = []
    for line in lines:
        m = TOKEN_LINE_RE.search(line)
        if not m:
            continue
        ts = _parse_ts(m.group("ts"))
        if not ts:
            continue
        d = ts.date()
        if dt_from and d < dt_from:
            continue
        if dt_to and d > dt_to:
            continue
        model_raw = m.group("model").strip()
        model = normalize_model_name(model_raw)
        input_tokens = int(m.group("input"))
        output_tokens = int(m.group("output"))
        total_cost = float(m.group("total"))
        entries.append({
            "ts": ts,
            "date": d.isoformat(),
            "model": model,
            "input": input_tokens,
            "output": output_tokens,
            "cost": total_cost
        })

    summary = {
        "total_requests": len(entries),
        "total_input_tokens": sum(e["input"] for e in entries),
        "total_output_tokens": sum(e["output"] for e in entries),
        "total_cost": round(sum(e["cost"] for e in entries), 6),
    }

    if group_by == "model":
        groups: Dict[str, Dict[str, Any]] = {}
        for e in entries:
            k = e["model"]
            g = groups.setdefault(k, {"model": k, "input_tokens": 0, "output_tokens": 0, "cost": 0.0})
            g["input_tokens"] += e["input"]
            g["output_tokens"] += e["output"]
            g["cost"] += e["cost"]
        by_model = [{"model": k, "input_tokens": v["input_tokens"], "output_tokens": v["output_tokens"], "cost": round(v["cost"], 6)} for k, v in groups.items()]
        return {"summary": summary, "by_model": by_model}
    else:
        groups: Dict[str, Dict[str, Any]] = {}
        for e in entries:
            k = e["date"]
            g = groups.setdefault(k, {"date": k, "input_tokens": 0, "output_tokens": 0, "cost": 0.0})
            g["input_tokens"] += e["input"]
            g["output_tokens"] += e["output"]
            g["cost"] += e["cost"]
        by_date = [{"date": k, "input_tokens": v["input_tokens"], "output_tokens": v["output_tokens"], "cost": round(v["cost"], 6)} for k, v in sorted(groups.items())]
        return {"summary": summary, "by_date": by_date}


def _resolve_pricing_file(pricing_model: Optional[str]) -> Optional[str]:
    """
    Dual-mode parsing:
    - If it's an absolute path, contains a path separator, or ends with .csv, treat it as a path (relative paths will be converted to absolute from the project root).
    - Otherwise, treat it as a preset name, mapped to <project_root>/mapping/{name}.csv.
    Returns the resolved absolute path; returns None if resolution fails.
    """
    if not pricing_model:
        return None
    name = str(pricing_model).strip()
    if not name:
        return None
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Path mode
    if os.path.isabs(name) or os.sep in name or name.lower().endswith(".csv"):
        path = name if os.path.isabs(name) else os.path.join(project_root, name)
        return os.path.abspath(path)
    # Preset name mode
    candidate = os.path.join(project_root, "mapping", f"{name}.csv")
    return os.path.abspath(candidate)

# Add /auth/refresh route after /auth/login
@router.post("/auth/refresh")
async def refresh_token(request: Request):
    """
    Renew an access token if the current one is valid and the user is still active.
    Frontend will call this proactively before expiry.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    old_token = auth_header[7:]
    payload = decode_token(old_token)  # will raise 401 if invalid/expired
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = get_user_by_username(username)
    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_token = create_access_token(user_id=user["id"], username=user["username"], role=user["role"])
    return {"access_token": new_token, "token_type": "bearer", "role": user["role"]}

class BootstrapAdminRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)

@router.get("/auth/bootstrap-status")
async def bootstrap_status():
    return {
        "has_user": auth_count_users() > 0,
        "whitelist_enabled": len(get_signup_whitelist()) > 0,
    }

@router.post("/auth/bootstrap-admin")
async def bootstrap_admin(req: BootstrapAdminRequest):
    if auth_count_users() > 0:
        raise HTTPException(status_code=400, detail="Bootstrap already completed")
    whitelist = [x.lower() for x in get_signup_whitelist()]
    if not whitelist:
        raise HTTPException(status_code=403, detail="Bootstrap disabled")
    if req.username.lower() not in whitelist:
        raise HTTPException(status_code=403, detail="Username not in whitelist")
    user_id = auth_create_user(req.username, req.password, role="admin", is_active=True)
    token = create_access_token(user_id=user_id, username=req.username, role="admin")
    return {"access_token": token, "token_type": "bearer", "role": "admin"}

# module-level: add import
def _ensure_pricing_csv(resolved_path: str) -> None:
    """
    Ensure the pricing CSV exists at resolved_path.
    - Prefer copying from <project_root>/mapping/pricing_model.csv if available.
    - Otherwise create header-only CSV (prevents 'file not found' warnings).
    """
    try:
        if not resolved_path or os.path.isfile(resolved_path):
            return
        os.makedirs(os.path.dirname(resolved_path), exist_ok=True)
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_candidates = [
            os.path.join(project_root, "mapping", "pricing_model.csv"),
            os.path.abspath(os.path.join(os.getcwd(), "mapping", "pricing_model.csv")),
        ]
        template_src = next((p for p in template_candidates if os.path.isfile(p)), None)
        if template_src:
            shutil.copyfile(template_src, resolved_path)
            logger.info(f"[admin/config] Generated missing pricing CSV: {resolved_path} from template {template_src}")
            return
        # Create header-only
        import csv as _csv
        with open(resolved_path, "w", encoding="utf-8", newline="") as f:
            writer = _csv.writer(f)
            writer.writerow(["Model Name", "Input Cost(1M Tokens)", "Output Cost(1M Tokens)"])
        logger.warning(f"[admin/config] Created empty pricing CSV with headers at {resolved_path}; costs will be 0 until rows are added.")
    except Exception as e:
        logger.warning(f"[admin/config] Failed to ensure pricing CSV at {resolved_path}: {e}")

class PromptModel(BaseModel):
    prompt_mode: Literal["type_specific", "general_only", "fallback_general"] = "type_specific"
    prompt_hint: str
    prompt_aet: str
    prompt_general: str

class PromptUpdate(BaseModel):
    prompt_mode: Optional[Literal["type_specific", "general_only", "fallback_general"]] = None
    prompt_hint: Optional[str] = None
    prompt_aet: Optional[str] = None
    prompt_general: Optional[str] = None

@router.get("/admin/prompts", response_model=PromptModel)
async def admin_get_prompts(request: Request):
    require_admin(request)
    data = auth_get_prompts()
    return PromptModel(**data)

@router.put("/admin/prompts", response_model=PromptModel)
async def admin_update_prompts(request: Request, body: PromptUpdate):
    require_admin(request)
    data = auth_update_prompts(
        prompt_mode=body.prompt_mode,
        prompt_hint=body.prompt_hint,
        prompt_aet=body.prompt_aet,
        prompt_general=body.prompt_general,
    )
    return PromptModel(**data)

class ModelDetailsUpdate(BaseModel):
    fields: Dict[str, Any]

@router.get("/admin/model-details")
async def admin_get_model_details(request: Request, model: str, source: Optional[str] = None):
    require_admin(request)
    # Locate CSV same as catalog
    cfg = auth_get_config()

    prefer = source or (cfg.get("pricing_model") or "").strip()
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_default = os.path.join(project_root, "mapping", "pricing_model.csv")
    cwd_default = os.path.abspath(os.path.join(os.getcwd(), "mapping", "pricing_model.csv"))
    candidates = []
    if prefer:
        try:
            prefer_path = _resolve_pricing_file(prefer)
            if prefer_path:
                candidates.append(os.path.abspath(prefer_path))
        except Exception:
            pass
    candidates.append(os.path.abspath(project_default))
    candidates.append(os.path.abspath(cwd_default))
    resolved = next((p for p in candidates if os.path.isfile(p)), None)

    base_fields: Dict[str, Any] = {}
    columns: List[str] = []
    if resolved:
        table = _read_csv_as_table(resolved)
        columns = table["columns"] or []
        name_col = next((c for c in columns if re.match(r'^(model\s*name|model)$', c.strip(), re.I)), None) or "Model Name"
        base_fields = next(
            (r for r in table["rows"] if str(r.get(name_col, "")).strip().lower() == str(model).strip().lower()),
            {}
        )
        columns = list(sorted(set(columns) | {"Model Name"}))

    ov = auth_get_model_override(model)
    merged = {**({"Model Name": model} if "Model Name" in columns or not base_fields else {}), **base_fields}
    merged.update(ov or {})
    all_cols = list(sorted(set(columns) | set(merged.keys())))
    return {"model": model, "fields": merged, "columns": all_cols}

@router.put("/admin/model-details")
async def admin_update_model_details(request: Request, model: str, body: ModelDetailsUpdate):
    require_admin(request)
    updated = auth_update_model_override(model, body.fields or {})
    # Return merged view
    resp = await admin_get_model_details(request, model)
    return resp

@router.delete("/admin/model-details")
async def admin_delete_model_details(request: Request, model: str, keys: Optional[str] = None):
    require_admin(request)
    key_list = [k.strip() for k in (keys or "").split(",") if k.strip()] or None
    auth_delete_model_override(model, key_list)
    resp = await admin_get_model_details(request, model)
    return resp
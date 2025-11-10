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

"""
Auth module: user storage (SQLite), password hashing (PBKDF2), JWT, and FastAPI dependencies.
"""

import os
import sqlite3
import hmac
import hashlib
import base64
import json
import time
import logging
from typing import Optional, Dict, Any, List

from fastapi import HTTPException, Request, status

# Config
from config import AUTH_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, AUTH_DB_PATH

logger = logging.getLogger(__name__)

# ---------- SQLite helpers ----------

def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# Module: auth (add user CRUD and config storage helpers)
def init_auth_db() -> None:
    with _get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin','user')),
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now'))
            )
            """
        )
        # Add config table for system parameters
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT (datetime('now'))
            )
            """
        )
        conn.commit()
    ensure_default_config()
    logger.info(f"Auth DB initialized at {AUTH_DB_PATH}")


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    with _get_db() as conn:
        row = conn.execute(
            "SELECT id, username, password_salt, password_hash, role, is_active FROM users WHERE username = ?",
            (username,),
        ).fetchone()
    return dict(row) if row else None


def create_user(username: str, password: str, role: str = "user", is_active: bool = True) -> int:
    salt_b64, hash_b64 = hash_password(password)
    with _get_db() as conn:
        cur = conn.execute(
            "INSERT INTO users (username, password_salt, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)",
            (username, salt_b64, hash_b64, role, 1 if is_active else 0),
        )
        conn.commit()
        return cur.lastrowid


# ---------- Password hashing (PBKDF2-HMAC-SHA256) ----------

def hash_password(password: str) -> (str, str):
    salt = os.urandom(16)
    salted_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return base64.urlsafe_b64encode(salt).decode("utf-8"), base64.urlsafe_b64encode(salted_hash).decode("utf-8")


def verify_password(password: str, salt_b64: str, hash_b64: str) -> bool:
    try:
        salt = base64.urlsafe_b64decode(salt_b64.encode("utf-8"))
        expected = base64.urlsafe_b64decode(hash_b64.encode("utf-8"))
    except Exception:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return hmac.compare_digest(candidate, expected)


# ---------- Minimal JWT (HS256) ----------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def create_access_token(user_id: int, username: str, role: str, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": username,
        "uid": user_id,
        "role": role,
        "iat": now,
        "exp": now + expires_minutes * 60,
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    sig = hmac.new(AUTH_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(sig)
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_token(token: str) -> Dict[str, Any]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(AUTH_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(signature_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Invalid signature")

        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        if "exp" in payload and int(time.time()) > int(payload["exp"]):
            raise ValueError("Token expired")
        return payload
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")


# ---------- FastAPI dependencies ----------

def get_current_user(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = auth_header[7:]
    payload = decode_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = get_user_by_username(username)
    if not user or not user["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def require_admin(request: Request) -> None:
    user = get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")


# ---------- Initial admin bootstrap ----------

def create_initial_admin() -> None:
    """
    Create an initial admin user if ADMIN_USERNAME and ADMIN_PASSWORD are provided via env variables.
    This will not overwrite existing users.
    """
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if not admin_username or not admin_password:
        logger.warning("ADMIN_USERNAME/ADMIN_PASSWORD not set; initial admin will NOT be created automatically.")
        return

    existing = get_user_by_username(admin_username)
    if existing:
        logger.info("Initial admin already exists, skip creation.")
        return

    user_id = create_user(admin_username, admin_password, role="admin", is_active=True)
    logger.info(f"Initial admin created: {admin_username} (id={user_id})")


# ---------- User CRUD (for admin) ----------
def list_users() -> list[Dict[str, Any]]:
    with _get_db() as conn:
        rows = conn.execute(
            "SELECT id, username, role, is_active, created_at FROM users ORDER BY id ASC"
        ).fetchall()
    return [dict(r) for r in rows]

def update_user(user_id: int,
                password: Optional[str] = None,
                role: Optional[str] = None,
                is_active: Optional[bool] = None) -> None:
    sets = []
    params: list[Any] = []
    if password is not None:
        salt_b64, hash_b64 = hash_password(password)
        sets.append("password_salt = ?")
        params.append(salt_b64)
        sets.append("password_hash = ?")
        params.append(hash_b64)
    if role is not None:
        if role not in ("admin", "user"):
            raise ValueError("Invalid role")
        sets.append("role = ?")
        params.append(role)
    if is_active is not None:
        sets.append("is_active = ?")
        params.append(1 if is_active else 0)
    if not sets:
        return
    params.append(user_id)
    with _get_db() as conn:
        conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = ?", tuple(params))
        conn.commit()

def delete_user(user_id: int) -> None:
    with _get_db() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()

# ---------- Config storage (temperature/model/pricing_model) ----------
def ensure_default_config() -> None:
    defaults = {
        "temperature": os.getenv("DEFAULT_TEMPERATURE", "0.3"),
        "model": os.getenv("DEFAULT_MODEL", "GPT-4.1"),
        "pricing_model": os.getenv("DEFAULT_PRICING_MODEL", "default"),
    }
    with _get_db() as conn:
        for k, v in defaults.items():
            conn.execute(
                """
                INSERT INTO config (key, value, updated_at)
                VALUES (?, ?, datetime('now'))
                ON CONFLICT(key) DO NOTHING
                """,
                (k, str(v)),
            )
        conn.commit()

def get_config() -> Dict[str, Any]:
    with _get_db() as conn:
        rows = conn.execute("SELECT key, value FROM config WHERE key IN ('temperature','model','pricing_model')").fetchall()
    data = {r["key"]: r["value"] for r in rows}
    # cast temperature to float if possible
    try:
        data["temperature"] = float(data.get("temperature", "0.3"))
    except Exception:
        data["temperature"] = 0.3
    data.setdefault("model", "GPT-4.1")
    data.setdefault("pricing_model", "default")
    return data

def update_config(temperature: Optional[float] = None,
                  model: Optional[str] = None,
                  pricing_model: Optional[str] = None) -> Dict[str, Any]:
    items: list[tuple[str, str]] = []
    if temperature is not None:
        items.append(("temperature", str(temperature)))
    if model is not None:
        items.append(("model", model))
    if pricing_model is not None:
        items.append(("pricing_model", pricing_model))
    if items:
        with _get_db() as conn:
            for k, v in items:
                conn.execute(
                    """
                    INSERT INTO config (key, value, updated_at)
                    VALUES (?, ?, datetime('now'))
                    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
                    """,
                    (k, v),
                )
            conn.commit()
    return get_config()


def count_users() -> int:
    with _get_db() as conn:
        row = conn.execute("SELECT COUNT(1) AS c FROM users").fetchone()
    return int(row["c"] if isinstance(row, sqlite3.Row) else row[0])

def get_signup_whitelist() -> list[str]:
    raw = os.getenv("ADMIN_SIGNUP_WHITELIST", "")
    items = [s.strip() for s in raw.split(",")]
    return [s.lower() for s in items if s]

def get_keyword_configs() -> List[Dict[str, str]]:
    with _get_db() as conn:
        row = conn.execute("SELECT value FROM config WHERE key = ?", ("keyword_color_configs",)).fetchone()
    if not row:
        return []
    try:
        raw = row["value"] if isinstance(row, sqlite3.Row) else row[0]
        items = json.loads(raw) if raw else []
    except Exception:
        items = []
    # sanitize shape: [{'keyword': str, 'color': '#RRGGBB'}]
    sanitized: List[Dict[str, str]] = []
    for it in items or []:
        kw = str((it or {}).get("keyword", "")).strip()
        color = str((it or {}).get("color", "#FF0000")).strip()
        if kw:
            if not color.startswith("#"):
                color = f"#{color}"
            if len(color) != 7:
                color = "#FF0000"
            sanitized.append({"keyword": kw, "color": color.upper()})
    return sanitized

def update_keyword_configs(items: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    # persist as JSON array of {keyword, color}
    cleaned: List[Dict[str, str]] = []
    for it in items or []:
        kw = str((it or {}).get("keyword", "")).strip()
        color = str((it or {}).get("color", "#FF0000")).strip()
        if kw:
            if not color.startswith("#"):
                color = f"#{color}"
            if len(color) != 7:
                color = "#FF0000"
            cleaned.append({"keyword": kw, "color": color.upper()})
    with _get_db() as conn:
        conn.execute(
            """
            INSERT INTO config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
            """,
            ("keyword_color_configs", json.dumps(cleaned, ensure_ascii=False)),
        )
        conn.commit()
    return cleaned

def get_prompts() -> Dict[str, Any]:
    with _get_db() as conn:
        rows = conn.execute(
            "SELECT key, value FROM config WHERE key IN ('prompt_mode','prompt_hint','prompt_aet','prompt_general')"
        ).fetchall()
    data = {r["key"]: r["value"] for r in rows}

    # 默认值（不写库，只在读取时兜底）
    data.setdefault("prompt_mode", "type_specific")
    data.setdefault("prompt_hint", 
        "You are a professional document analysis assistant.\n"
        "Query Type: Hint Analysis.\n"
        "For each evidence item, provide separate analysis with 'Evidence' and 'Analysis' sections.\n"
        "Answer only based on provided documents."
    )
    data.setdefault("prompt_aet",
        "You are a professional document analysis assistant.\n"
        "Focus on AET-related evidence from provided documents.\n"
        "Answer only based on provided documents."
    )
    data.setdefault("prompt_general",
        "You are a professional document analysis assistant.\n"
        "Answer only based on provided documents."
    )
    return data

def update_prompts(prompt_mode: Optional[str] = None,
                   prompt_hint: Optional[str] = None,
                   prompt_aet: Optional[str] = None,
                   prompt_general: Optional[str] = None) -> Dict[str, Any]:
    items: list[tuple[str, str]] = []
    if prompt_mode is not None:
        if prompt_mode not in ("type_specific", "general_only", "fallback_general"):
            raise ValueError("Invalid prompt_mode")
        items.append(("prompt_mode", prompt_mode))
    if prompt_hint is not None:
        items.append(("prompt_hint", prompt_hint))
    if prompt_aet is not None:
        items.append(("prompt_aet", prompt_aet))
    if prompt_general is not None:
        items.append(("prompt_general", prompt_general))

    if items:
        with _get_db() as conn:
            for k, v in items:
                conn.execute(
                    """
                    INSERT INTO config (key, value, updated_at)
                    VALUES (?, ?, datetime('now'))
                    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
                    """,
                    (k, v),
                )
            conn.commit()
    return get_prompts()


def list_model_overrides() -> Dict[str, Dict[str, Any]]:
    with _get_db() as conn:
        rows = conn.execute("SELECT key, value FROM config WHERE key LIKE 'model_override:%'").fetchall()
    result: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        key = r["key"]
        name = key.split("model_override:", 1)[1]
        try:
            result[name] = json.loads(r["value"])
        except Exception:
            result[name] = {}
    return result

def get_model_details_override(model_name: str) -> Dict[str, Any]:
    key = f"model_override:{model_name}"
    with _get_db() as conn:
        row = conn.execute("SELECT value FROM config WHERE key = ?", (key,)).fetchone()
    if not row:
        return {}
    try:
        return json.loads(row["value"] if isinstance(row, sqlite3.Row) else row[0])
    except Exception:
        return {}

def update_model_details_override(model_name: str, fields: Dict[str, Any]) -> Dict[str, Any]:
    prev = get_model_details_override(model_name)
    prev.update(fields or {})
    key = f"model_override:{model_name}"
    with _get_db() as conn:
        conn.execute(
            """
            INSERT INTO config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
            """,
            (key, json.dumps(prev, ensure_ascii=False)),
        )
        conn.commit()
    return prev

def delete_model_details_override(model_name: str, keys: Optional[List[str]] = None) -> Dict[str, Any]:
    if keys:
        prev = get_model_details_override(model_name)
        for k in keys:
            prev.pop(k, None)
        return update_model_details_override(model_name, prev)
    key = f"model_override:{model_name}"
    with _get_db() as conn:
        conn.execute("DELETE FROM config WHERE key = ?", (key,))
        conn.commit()
    return {}
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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import uvicorn
from config import setup_logging
from routes import router
import auth
import os
import shutil
import csv
from fastapi.staticfiles import StaticFiles
import sys
import os
import webbrowser
import threading
import time

# Setup logging
logger = setup_logging()

app = FastAPI()

# Add middleware to log requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    logger.info(
        f"Request started: {request.method} {request.url.path} "
        f"- Client: {request.client.host}"
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        logger.info(
            f"Request completed: {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Time: {process_time:.3f}s"
        )
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"- Error: {str(e)} - Time: {process_time:.3f}s"
        )
        raise

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

def ensure_pricing_csv(resolved_path: str, project_root: str, pricing_model: str) -> None:
    """
    Ensure the pricing CSV exists at resolved_path.
    - If missing and pricing_model is 'default' (or path endswith default.csv), copy from mapping/pricing_model.csv if present.
    - If template not found, create a header-only CSV to avoid 'file not found' warnings.
    """
    try:
        if not resolved_path:
            return
        if os.path.isfile(resolved_path):
            return

        os.makedirs(os.path.dirname(resolved_path), exist_ok=True)

        # Prefer copying from the project template CSV
        template_candidates = [
            os.path.join(project_root, "mapping", "pricing_model.csv"),
            os.path.abspath(os.path.join(os.getcwd(), "mapping", "pricing_model.csv")),
        ]
        template_src = next((p for p in template_candidates if os.path.isfile(p)), None)

        if template_src:
            shutil.copyfile(template_src, resolved_path)
            logger.info(f"[startup] Generated missing pricing CSV: {resolved_path} from template {template_src}")
            return

        # Fallback: create header-only CSV (avoids not-found warning, but costs remain 0 until data is added)
        with open(resolved_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Model Name", "Input Cost(1M Tokens)", "Output Cost(1M Tokens)"])
        logger.warning(f"[startup] Created empty pricing CSV with headers at {resolved_path}; costs will be 0 until rows are added.")
    except Exception as e:
        logger.warning(f"[startup] Failed to ensure pricing CSV at {resolved_path}: {e}")

@app.on_event("startup")
def _init_auth():
    auth.init_auth_db()
    auth.create_initial_admin()
    # Restore PRICING_FILE from DB (persists across restarts)
    try:
        cfg = auth.get_config()
        pricing_model = (cfg or {}).get("pricing_model")
        if pricing_model:
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            # Parsing logic consistent with routes (simplified)
            if os.path.isabs(pricing_model) or os.sep in pricing_model or str(pricing_model).lower().endswith(".csv"):
                path = pricing_model if os.path.isabs(pricing_model) else os.path.join(project_root, pricing_model)
            else:
                path = os.path.join(project_root, "mapping", f"{pricing_model}.csv")

            # Ensure the pricing CSV exists (generate if missing)
            ensure_pricing_csv(path, project_root, pricing_model)

            os.environ["PRICING_FILE"] = os.path.abspath(path)
            logger.info(f"[startup] PRICING_FILE set to: {os.environ['PRICING_FILE']}")
        else:
            os.environ.pop("PRICING_FILE", None)
            logger.info("[startup] PRICING_FILE cleared (use default mapping/pricing_model.csv)")
    except Exception as e:
        logger.warning(f"[startup] Failed to restore PRICING_FILE: {e}")

# Add static file service
if os.path.exists("../frontend/build"):
    app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")
    app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="frontend")
# Add the following code before uvicorn.run()
if getattr(sys, 'frozen', False):
    # If running in a PyInstaller bundled environment
    if sys.stdout is None:
        sys.stdout = open(os.devnull, 'w')
    if sys.stderr is None:
        sys.stderr = open(os.devnull, 'w')
    if sys.stdin is None:
        sys.stdin = open(os.devnull, 'r')

def open_browser():
    """Delay opening the browser"""
    time.sleep(2)  # Wait for server to start
    webbrowser.open('http://localhost:8000')

# add route type imports for safe logging
from fastapi.routing import APIRoute
from starlette.routing import Mount

if __name__ == "__main__":
    logger.info("Starting application server")
    # Launch browser (only in non-bundled dev or when needed)
    if not getattr(sys, 'frozen', False):  # Development environment
        threading.Thread(target=open_browser, daemon=True).start()
    
    # SAFE route logging: handle APIRoute vs Mount
    for route in app.routes:
        try:
            if isinstance(route, APIRoute):
                logger.info(f"Registered route: {route.path}, methods: {sorted(route.methods)}")
            elif isinstance(route, Mount):
                mount_target = getattr(route.app, 'name', getattr(route.app, '__class__', type(route.app)).__name__)
                logger.info(f"Mounted route: {route.path} -> {mount_target}")
            else:
                logger.info(f"Route: {getattr(route, 'path', str(route))} ({route.__class__.__name__})")
        except Exception as e:
            logger.warning(f"Failed to log route info for {route}: {e}")
    
    logger.info("Server will be available at: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
#!/usr/bin/env bash
set -euo pipefail

# ===== Admin credentials (change for your env) =====
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="Jackson123!"
# ===================================================

# 切到项目根目录（脚本所在目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# （可选）启动后端：使用 --app-dir 指向 src，避免 ModuleNotFoundError
# 如需后台运行并记录日志：
# nohup python3 -m uvicorn main:app --app-dir src --host 0.0.0.0 --port 8000 > backend.out 2>&1 & echo $! > backend.pid

# 也可以前台运行（便于开发调试）：
python3 -m uvicorn main:app --app-dir src --host 0.0.0.0 --port 8000
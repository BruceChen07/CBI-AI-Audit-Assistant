# 后端冒烟测试与部署要点（Windows）

## 环境准备
- Python 3.10+（建议与项目的 .venv 对齐）
- Windows 终端：cmd.exe
- 可选：项目自带虚拟环境 .venv 或 test_env

## 关键环境变量
- API_BASE：后端 API 根地址（默认 http://localhost:8000）
- ADMIN_USERNAME / ADMIN_PASSWORD：管理员账号；需与后端启动时的环境变量一致（后端会按这两个变量在 SQLite 中创建初始管理员）

> 后端会在启动时读取 ADMIN_USERNAME/ADMIN_PASSWORD 创建初始管理员。若未设置，登录接口将无法用默认值通过。

## 启动后端
- 推荐使用项目根目录的 start_services.bat（如存在）启动后端
- 或手动启动（示例）：
  1. 激活虚拟环境（任选其一）
     - .venv\Scripts\activate.bat
     - test_env\Scripts\activate.bat
  2. 安装依赖
     - pip install -r requirements.txt
  3. 设置环境变量（示例）
     - set ADMIN_USERNAME=admin
     - set ADMIN_PASSWORD=admin123
  4. 启动服务（示例）
     - python -m uvicorn src.main:app --host 127.0.0.1 --port 8000

## 运行冒烟测试
- 直接双击 run_smoke_test.bat，或在 cmd 中执行：
  - run_smoke_test.bat
- 脚本会：
  1. 自动选择 Python 解释器（优先 .venv，其次 test_env，最后系统 python）
  2. 自动安装 requests（若缺失）
  3. 探测 API 健康检查（/test/），若不通尝试调用 start_services.bat 并轮询等待
  4. 执行 test/smoke_api.py：
     - /auth/login
     - /auth/refresh
     - /admin/config
     - /admin/metrics/tokens?group_by=date

## 常见问题
- 登录失败：确认后端启动时设置了 ADMIN_USERNAME/ADMIN_PASSWORD，并与 run_smoke_test.bat 使用的一致
- 端口冲突：调整 API_BASE 或 uvicorn 启动端口（--port）
- 依赖问题：优先在 .venv 或 test_env 中运行；必要时执行 pip install -r requirements.txt
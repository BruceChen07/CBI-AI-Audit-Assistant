@echo off
REM ===== Admin credentials (change for your env) =====
set "ADMIN_USERNAME=admin"
set "ADMIN_PASSWORD=Jackson123!"
REM ===================================================
echo ===================================
echo    AI Audit Assistant 启动脚本
echo ===================================
echo.

set FRONTEND_DIR=frontend
set BACKEND_DIR=src

:start
cls
echo 正在启动服务...
echo.

:: 启动后端服务
echo [1/2] 启动后端服务...
start cmd /k "cd %BACKEND_DIR% && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 等待2秒确保后端启动
timeout /t 2 /nobreak > nul

:: 启动前端服务
echo [2/2] 启动前端服务...
start cmd /k "cd %FRONTEND_DIR% && npm start"

echo.
echo 所有服务已启动！
echo.
echo 后端API: http://localhost:8000
echo 前端页面: http://localhost:3000
echo.
echo 按 R 重启所有服务
echo 按 Q 退出
echo.

:choice
choice /c RQ /n /m "请选择操作: "

if errorlevel 2 goto end
if errorlevel 1 goto restart

:restart
echo.
echo 正在重启所有服务...

:: 关闭所有相关的命令行窗口
echo 关闭现有服务...
taskkill /f /im cmd.exe /fi "windowtitle eq *npm*" > nul 2>&1
taskkill /f /im cmd.exe /fi "windowtitle eq *uvicorn*" > nul 2>&1

:: 等待2秒确保所有进程都已关闭
timeout /t 2 /nobreak > nul

:: 重新启动服务
goto start

:end
echo.
echo 正在关闭所有服务...
taskkill /f /im cmd.exe /fi "windowtitle eq *npm*" > nul 2>&1
taskkill /f /im cmd.exe /fi "windowtitle eq *uvicorn*" > nul 2>&1
echo 所有服务已关闭！
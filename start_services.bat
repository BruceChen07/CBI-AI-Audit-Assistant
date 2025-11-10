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
echo starting services...
echo.
echo [env] MAX_AI_URL=%MAX_AI_URL%
echo [env] MAX_API_KEY=%MAX_API_KEY%

:: start backend service
echo [1/2] starting backend service...
start cmd /k "cd %BACKEND_DIR% && set MAX_AI_URL=%MAX_AI_URL% && set MAX_API_KEY=%MAX_API_KEY% && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --env-file ..\.env"

:: wait 2 seconds to ensure backend service is started
timeout /t 2 /nobreak > nul

:: start frontend service
echo [2/2] starting frontend service...
start cmd /k "cd %FRONTEND_DIR% && npm start"

echo.
echo all services started!
echo.
echo backend api: http://localhost:8000
echo frontend page: http://localhost:3000
echo.
echo press R to restart all services
echo press Q to exit
echo.

:choice
choice /c RQ /n /m "Please select an operation: "

if errorlevel 2 goto end
if errorlevel 1 goto restart

:restart
echo.
echo restarting all services...

echo closing all related command line windows...
taskkill /f /im cmd.exe /fi "windowtitle eq *npm*" > nul 2>&1
taskkill /f /im cmd.exe /fi "windowtitle eq *uvicorn*" > nul 2>&1

:: wait 2 seconds to ensure all processes are closed
timeout /t 2 /nobreak > nul

:: restart services
goto start

:end
echo.
echo closing all services...
taskkill /f /im cmd.exe /fi "windowtitle eq *npm*" > nul 2>&1
taskkill /f /im cmd.exe /fi "windowtitle eq *uvicorn*" > nul 2>&1
echo all services closed!

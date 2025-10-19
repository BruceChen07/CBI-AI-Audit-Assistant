@echo off
setlocal enabledelayedexpansion

REM ========== Config ==========
if "%API_BASE%"=="" set API_BASE=http://localhost:8000
if "%ADMIN_USERNAME%"=="" set ADMIN_USERNAME=admin
if "%ADMIN_PASSWORD%"=="" set ADMIN_PASSWORD=admin123

echo [INFO] API_BASE=%API_BASE%
echo [INFO] ADMIN_USERNAME=%ADMIN_USERNAME%

REM ========== Pick Python ==========
set PYTHON_EXE=
if exist ".\.venv\Scripts\python.exe" (
  set "PYTHON_EXE=.\.venv\Scripts\python.exe"
) else if exist ".\test_env\Scripts\python.exe" (
  set "PYTHON_EXE=.\test_env\Scripts\python.exe"
) else (
  set "PYTHON_EXE=python"
)

echo [INFO] Using Python: %PYTHON_EXE%

REM ========== Ensure requests installed ==========
"%PYTHON_EXE%" -c "import requests" >nul 2>nul
if NOT "%ERRORLEVEL%"=="0" (
  echo [INFO] Installing requests...
  "%PYTHON_EXE%" -m pip install -q requests
  if NOT "%ERRORLEVEL%"=="0" (
    echo [ERROR] Failed to install requests.
    exit /b 1
  )
)

REM ========== Health check ==========
echo [INFO] Checking backend health: %API_BASE%/test/
"%PYTHON_EXE%" -c "import os,sys,requests; url=os.environ.get('API_BASE','http://localhost:8000').rstrip('/')+'/test/'; print('GET',url); r=requests.get(url,timeout=3); print('HTTP',r.status_code); sys.exit(0 if r.ok else 1)"
if NOT "%ERRORLEVEL%"=="0" (
  echo [WARN] Backend not reachable. Trying to start services...
  if exist ".\start_services.bat" (
    call ".\start_services.bat"
    echo [INFO] Waiting for backend to become ready...
  ) else (
    echo [WARN] start_services.bat not found. Please ensure backend is running at %API_BASE%
  )

  set "READY=0"
  for /l %%I in (1,1,10) do (
    timeout /t 3 /nobreak >nul
    "%PYTHON_EXE%" -c "import os,sys,requests; url=os.environ.get('API_BASE','http://localhost:8000').rstrip('/')+'/test/'; r=requests.get(url,timeout=3); sys.exit(0 if r.ok else 1)"
    if "%ERRORLEVEL%"=="0" (
      set "READY=1"
      goto :READY_OK
    )
    echo [INFO] Retry %%I/10...
  )
  :READY_OK
  if "%READY%"=="0" (
    echo [ERROR] Backend still not reachable. Abort.
    exit /b 2
  )
)

REM ========== Run smoke tests ==========
echo [INFO] Running smoke tests...
set "PYTHONIOENCODING=utf-8"
set "API_BASE=%API_BASE%"
set "ADMIN_USERNAME=%ADMIN_USERNAME%"
set "ADMIN_PASSWORD=%ADMIN_PASSWORD%"
"%PYTHON_EXE%" ".\test\smoke_api.py"
if NOT "%ERRORLEVEL%"=="0" (
  echo [ERROR] Smoke tests failed.
  exit /b 3
)

echo [DONE] Smoke tests passed.
exit /b 0
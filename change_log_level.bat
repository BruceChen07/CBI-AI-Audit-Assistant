@echo off
setlocal enabledelayedexpansion

REM Set default values
set FILE_LEVEL=DEBUG
set CONSOLE_LEVEL=DEBUG

REM Process command line arguments
if "%1"=="" (
    echo Usage: %0 [file_level] [console_level]
    echo Example: %0 INFO WARNING
    echo Current settings: File log level=%FILE_LEVEL%, Console log level=%CONSOLE_LEVEL%
) else (
    set FILE_LEVEL=%1
    if not "%2"=="" set CONSOLE_LEVEL=%2
    
    echo Updating log levels...
    echo File log level: %FILE_LEVEL%
    echo Console log level: %CONSOLE_LEVEL%
    
    REM Create temporary file
    type nul > temp_config.py
    
    for /f "tokens=*" %%a in ('type "src\config.py"') do (
        set line=%%a
        set modified=0
        
        echo !line! | findstr /C:"file_handler.setLevel(logging." > nul
        if !errorlevel! equ 0 (
            echo     file_handler.setLevel(logging.%FILE_LEVEL%) >> temp_config.py
            set modified=1
        )
        
        echo !line! | findstr /C:"console_handler.setLevel(logging." > nul
        if !errorlevel! equ 0 (
            echo     console_handler.setLevel(logging.%CONSOLE_LEVEL%) >> temp_config.py
            set modified=1
        )
        
        if !modified! equ 0 (
            echo !line! >> temp_config.py
        )
    )
    
    move /y temp_config.py "src\config.py" > nul
    echo Log levels have been updated
)

endlocal
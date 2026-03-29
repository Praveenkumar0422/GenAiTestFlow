@echo off
REM Start TestFlow Application (Batch Version)

setlocal enabledelayedexpansion

set "PROJECT_ROOT=c:\Users\Admin\Downloads\GenAiTestFlow\app-main"

echo.
echo ================================
echo Starting TestFlow Application...
echo ================================
echo.

REM Check if .env file exists
if not exist "%PROJECT_ROOT%\.env" (
    echo ERROR: .env file not found!
    echo Please create .env file in %PROJECT_ROOT%
    echo.
    pause
    exit /b 1
)

REM Start Backend Server in new window
echo Starting Backend Server on port 8000...
start "TestFlow Backend" cmd /k "cd /d %PROJECT_ROOT%\backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

REM Wait for backend to start
timeout /t 4 /nobreak

REM Start Frontend Server in new window
echo Starting Frontend Server on port 3000...
start "TestFlow Frontend" cmd /k "cd /d %PROJECT_ROOT%\frontend && npm start"

REM Wait for frontend to start
timeout /t 6 /nobreak

REM Open browser
echo Opening browser...
start http://localhost:3000

echo.
echo ================================
echo TestFlow Application Started!
echo ================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Default Credentials:
echo Email:    admin@testflow.com
echo Password: admin123
echo.
echo Press Ctrl+C in any window to stop the servers
echo.

pause

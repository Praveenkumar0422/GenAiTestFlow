# Start Backend Server Only
$projectRoot = "c:\Users\Admin\Downloads\GenAiTestFlow\app-main"
$pythonExe = "c:\Users\Admin\Downloads\GenAiTestFlow\.venv\Scripts\python.exe"

Write-Host "Starting Backend Server..." -ForegroundColor Green
cd "$projectRoot\backend"

if (-not (Test-Path $pythonExe)) {
    Write-Host "ERROR: Python virtualenv not found at $pythonExe" -ForegroundColor Red
    exit 1
}

Write-Host "Backend running on: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

& $pythonExe -m uvicorn server:app --reload --reload-exclude "temp_test_*.py" --host 0.0.0.0 --port 8000

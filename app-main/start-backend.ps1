# Start Backend Server Only
$projectRoot = "c:\Users\Admin\Downloads\GenAiTestFlow\app-main"

Write-Host "Starting Backend Server..." -ForegroundColor Green
cd "$projectRoot\backend"

Write-Host "Backend running on: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Define paths
$projectRoot = "c:\Users\Admin\Downloads\GenAiTestFlow\app-main"

Write-Host "================================" -ForegroundColor Green
Write-Host "Starting TestFlow Application..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path "$projectRoot\.env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file in $projectRoot" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Backend Server
Write-Host "Starting Backend Server on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

# Wait for backend to start
Start-Sleep -Seconds 4

# Start Frontend Server
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm start"

# Wait for frontend to start
Start-Sleep -Seconds 6

# Open browser
Write-Host "Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "TestFlow Application Started!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Cyan
Write-Host "Email:    admin@testflow.com" -ForegroundColor Cyan
Write-Host "Password: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in any window to stop the servers" -ForegroundColor Yellow
Write-Host ""

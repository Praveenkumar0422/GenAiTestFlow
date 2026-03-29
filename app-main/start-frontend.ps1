# Start Frontend Server Only
$projectRoot = "c:\Users\Admin\Downloads\GenAiTestFlow\app-main"

Write-Host "Starting Frontend Server..." -ForegroundColor Green
cd "$projectRoot\frontend"

Write-Host "Frontend running on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$env:PORT=3000
npm start

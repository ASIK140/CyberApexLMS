# Kill any process on port 5000
$proc = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($proc) {
    Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\CyberApex LMS\CyberApex LMS\CyberApex-backend'; npm run dev" -WindowStyle Normal
Write-Host "Backend starting..."
Start-Sleep -Seconds 5
Write-Host "Done"
$ErrorActionPreference = "Stop"

# Test login with employeeId (login ID)
Write-Host "Testing login with employeeId (STU001)..."
$loginBody = @{
    email = "STU001"
    password = "Student123!"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "SUCCESS! Login with employeeId works!"
    Write-Host "User: $($loginResp.data.user.email)"
    Write-Host "Role: $($loginResp.data.user.role)"
    Write-Host "First Name: $($loginResp.data.user.firstName)"
} catch {
    Write-Host "Login failed with employeeId: $_"
}

Write-Host ""
Write-Host "Testing login with email..."
$loginBody2 = @{
    email = "student001@cyberapex.com"
    password = "Student123!"
} | ConvertTo-Json

try {
    $loginResp2 = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody2 -ContentType "application/json"
    Write-Host "SUCCESS! Login with email works!"
    Write-Host "User: $($loginResp2.data.user.email)"
    Write-Host "Role: $($loginResp2.data.user.role)"
} catch {
    Write-Host "Login failed with email: $_"
}
$ErrorActionPreference = "Stop"

# Test login with employee (student)
Write-Host "Testing login with employee..."
$loginBody = @{
    email = "employee@democorp.com"
    password = "Employee1234!"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "SUCCESS! Login with employee works!"
    Write-Host "User: $($loginResp.data.user.email)"
    Write-Host "Role: $($loginResp.data.user.role)"
    Write-Host "First Name: $($loginResp.data.user.firstName)"
} catch {
    Write-Host "Login failed with employee: $_"
}

Write-Host ""
Write-Host "Testing login with admin email..."
$loginBody2 = @{
    email = "admin@sa-lms.dev"
    password = "Admin1234!"
} | ConvertTo-Json

try {
    $loginResp2 = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody2 -ContentType "application/json"
    Write-Host "SUCCESS! Login with admin email works!"
    Write-Host "User: $($loginResp2.data.user.email)"
    Write-Host "Role: $($loginResp2.data.user.role)"
    
    $token = $loginResp2.data.accessToken
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "Fetching Admin Dashboard..."
    try {
        $dashboardResp = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/dashboard" -Method Get -Headers $headers
        Write-Host "Dashboard fetch success"
    } catch {
        Write-Host "Dashboard fetch failed: $_"
        Write-Host "Response content: $($_.Exception.Response | Select-Object -ExpandProperty Content | Out-String)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response body: $($reader.ReadToEnd())"
    }
} catch {
    Write-Host "Login failed with email: $_"
}
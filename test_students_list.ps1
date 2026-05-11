$ErrorActionPreference = "Stop"

# Login as admin
$loginBody = @{
    email = "admin@sa-lms.dev"
    password = "Admin1234!"
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResp.data.accessToken
Write-Host "Admin token received"

# Get all students from unified endpoint
$headers = @{
    "Authorization" = "Bearer $token"
}

$studentsResp = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/admin/students" -Method Get -Headers $headers
Write-Host "Total students found: $($studentsResp.total)"
Write-Host ""

$studentsResp.data | ForEach-Object {
    Write-Host "Student: $($_.name) | Email: $($_.email) | Login ID: $($_.login_id) | Status: $($_.service_status) | Source: $($_.source)"
}
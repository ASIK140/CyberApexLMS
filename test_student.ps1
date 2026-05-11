$ErrorActionPreference = "Stop"

# Login as admin
$loginBody = @{
    email = "admin@sa-lms.dev"
    password = "Admin1234!"
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResp.data.accessToken
Write-Host "Admin token received"

# Get first tenant
$headers = @{
    "Authorization" = "Bearer $token"
}

$tenantsResp = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/tenants" -Method Get -Headers $headers
$tenantId = $tenantsResp.data[0].id
Write-Host "Using tenant: $tenantId"

# Create a new student
$studentBody = @{
    email = "student001@cyberapex.com"
    password = "Student123!"
    firstName = "John"
    lastName = "Smith"
    role = "student"
    employeeId = "STU001"
    department = "IT"
    jobRoleCategory = "general"
} | ConvertTo-Json

try {
    $studentResp = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/tenants/$tenantId/users" -Method Post -Headers $headers -Body $studentBody -ContentType "application/json"
    Write-Host "Student created successfully!"
    Write-Host "Student ID: $($studentResp.data.id)"
    Write-Host "Email: $($studentResp.data.email)"
    Write-Host "Role: $($studentResp.data.role)"
} catch {
    Write-Host "Error creating student: $_"
    $_.Exception.Response.StatusCode
}
$tokenResponse = Invoke-RestMethod -Uri "http://localhost:8080/realms/service-system/protocol/openid-connect/token" -Method Post -Body @{
    grant_type = "client_credentials"
    client_id = "backend-service"
    client_secret = "VBXVaRMOCvx0gr6gO2ByRbUKUXU3lMzc"
}
$adminToken = $tokenResponse.access_token

$users = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/service-system/users" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
$nedux = $users | Where-Object { $_.username -eq 'nedux' }
Write-Output "Nedux ID: $($nedux.id)"

$roles = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/service-system/users/$($nedux.id)/role-mappings/realm" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Output "Nedux Roles: $($roles.name -join ', ')"

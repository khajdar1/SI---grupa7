$tokenResponse = Invoke-RestMethod -Uri "http://localhost:8080/realms/service-system/protocol/openid-connect/token" -Method Post -Body @{
    grant_type = "client_credentials"
    client_id = "backend-service"
    client_secret = "VBXVaRMOCvx0gr6gO2ByRbUKUXU3lMzc"
}
$adminToken = $tokenResponse.access_token

$allRoles = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/service-system/roles" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
$koordinatorRole = $allRoles | Where-Object { $_.name -eq 'Koordinator' }
Write-Output "Role ID for Koordinator: $($koordinatorRole.id)"

$body = @( @{ id = $koordinatorRole.id; name = "Koordinator" } ) | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/service-system/users/66a4c8c6-0bd9-4b6b-b712-9efcdf7d24db/role-mappings/realm" -Method Post -Headers @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" } -Body $body
Write-Output "Role assigned!"

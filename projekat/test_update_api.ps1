$adminToken = (Invoke-RestMethod -Uri "http://localhost:8080/realms/service-system/protocol/openid-connect/token" -Method Post -Body @{ grant_type = "password"; client_id = "backend-service"; username = "nedux"; password = "test_password_here" }).access_token
# Wait, I still don't know nedux's password.

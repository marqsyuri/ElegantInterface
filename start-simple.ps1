# Script PowerShell simples para iniciar o projeto
Write-Host "Iniciando Estetica Pro..." -ForegroundColor Green

# Verificar se estamos no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: package.json nao encontrado. Execute este script na pasta do projeto." -ForegroundColor Red
    exit 1
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    "DATABASE_URL=postgresql://postgres:1234@localhost:5432/estetica_pro`nSESSION_SECRET=estetica_pro_session_secret_key_2024_very_long_and_secure_string`nNODE_ENV=development`nPORT=5000" | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Arquivo .env criado" -ForegroundColor Green
}

Write-Host "Iniciando CLIENT (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:client"

Write-Host "Aguardando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Iniciando SERVER (Express)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:server"

Write-Host "Projeto iniciado!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Login: admin / admin" -ForegroundColor Cyan

Read-Host "Pressione Enter para fechar"





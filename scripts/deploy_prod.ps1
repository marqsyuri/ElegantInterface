# Deploy Script for Windows (PowerShell)
# Usage: .\scripts\deploy_prod.ps1

Write-Host "🚀 Starting Production Update..." -ForegroundColor Cyan

# 1. Install Dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# 2. Database Migrations
Write-Host "🗄️  Syncing database schema..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed" -ForegroundColor Red
    exit 1
}

# 3. Build Application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# 4. Instructions for Restart
Write-Host "✅ Update completed successfully!" -ForegroundColor Green
Write-Host "👉 If you are using PM2, run: pm2 restart all" -ForegroundColor Cyan
Write-Host "👉 Or stop your current server and run: npm start" -ForegroundColor Cyan

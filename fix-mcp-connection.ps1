#!/usr/bin/env pwsh
# Fix MCP Connection Issues

Write-Host "🔧 Fixing MCP Connection Issues..." -ForegroundColor Green

Write-Host "`n📋 Current Issues Identified:" -ForegroundColor Yellow
Write-Host "1. Go MCP Server (finanace-managment-app-1) is not responding"
Write-Host "2. Node.js MCP Proxy has wrong MCP_URL configuration"
Write-Host "3. Frontend is receiving localhost URLs instead of production URLs"

Write-Host "`n🛠️ Required Fixes:" -ForegroundColor Cyan

Write-Host "`n1️⃣ Fix Go MCP Server:" -ForegroundColor White
Write-Host "   • Go to Render Dashboard"
Write-Host "   • Check finanace-managment-app-1 service"
Write-Host "   • Check deployment logs for errors"
Write-Host "   • If failed, trigger Manual Deploy"
Write-Host "   • Ensure environment variables:"
Write-Host "     PORT=8080"
Write-Host "     GO_ENV=production"

Write-Host "`n2️⃣ Fix Node.js MCP Proxy Environment:" -ForegroundColor White
Write-Host "   • Go to finanace-managment-app-2 service"
Write-Host "   • Environment → Update MCP_URL:"
Write-Host "     MCP_URL=https://finanace-managment-app-1.onrender.com/mcp/stream"
Write-Host "   • Manual Deploy"

Write-Host "`n3️⃣ Alternative: Use Mock Mode:" -ForegroundColor White
Write-Host "   If Go server won't deploy, update Node.js proxy to use mock data:"
Write-Host "   • Set MCP_URL=http://localhost:8080/mcp/stream (will use mock)"
Write-Host "   • This allows the app to work with simulated financial data"

Write-Host "`n🧪 Test Commands After Fixes:" -ForegroundColor Magenta
Write-Host "# Test Go MCP Server"
Write-Host "curl https://finanace-managment-app-1.onrender.com/health"
Write-Host ""
Write-Host "# Test Node.js Proxy"
Write-Host "curl https://finanace-managment-app-2.onrender.com/mcp/initiate"
Write-Host ""
Write-Host "# Test Main Backend"
Write-Host "curl https://finanace-managment-app.onrender.com/api/mcp/initiate"

Write-Host "`n🎯 Expected Results:" -ForegroundColor Green
Write-Host "✅ Go MCP Server returns health status"
Write-Host "✅ MCP Proxy returns session with production login URL"
Write-Host "✅ Frontend receives proper JSON responses"
Write-Host "✅ No more 'Unexpected token' errors"

Write-Host "`n⚡ Quick Test - Current Status:" -ForegroundColor Blue

Write-Host "Testing Go MCP Server..." -NoNewline
try {
    $goResponse = Invoke-RestMethod -Uri "https://finanace-managment-app-1.onrender.com/health" -UseBasicParsing -TimeoutSec 10
    Write-Host " ✅ OK" -ForegroundColor Green
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

Write-Host "Testing Node.js Proxy..." -NoNewline
try {
    $proxyResponse = Invoke-RestMethod -Uri "https://finanace-managment-app-2.onrender.com/health" -UseBasicParsing -TimeoutSec 10
    Write-Host " ✅ OK" -ForegroundColor Green
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

Write-Host "Testing Main Backend..." -NoNewline
try {
    $backendResponse = Invoke-RestMethod -Uri "https://finanace-managment-app.onrender.com/health" -UseBasicParsing -TimeoutSec 10
    Write-Host " ✅ OK" -ForegroundColor Green
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

Write-Host "`n🔧 Priority Actions:" -ForegroundColor Red
Write-Host "1. Fix Go MCP Server deployment (highest priority)"
Write-Host "2. Update Node.js proxy MCP_URL"
Write-Host "3. Test the frontend connection"

Write-Host "`n✅ Follow the steps above to fix the connection!" -ForegroundColor Green
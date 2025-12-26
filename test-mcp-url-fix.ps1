#!/usr/bin/env pwsh
# Test MCP URL Fix

Write-Host "🧪 Testing MCP URL Fix..." -ForegroundColor Green

Write-Host "`n1. Testing Node.js MCP Proxy..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "https://finanace-managment-app-2.onrender.com/mcp/initiate" -UseBasicParsing
    
    if ($response.login_url -like "*finanace-managment-app-1.onrender.com*") {
        Write-Host " ✅ FIXED - Using production URL" -ForegroundColor Green
        Write-Host "   Login URL: $($response.login_url)" -ForegroundColor Blue
    } elseif ($response.login_url -like "*localhost*") {
        Write-Host " ❌ STILL BROKEN - Using localhost" -ForegroundColor Red
        Write-Host "   Login URL: $($response.login_url)" -ForegroundColor Red
        Write-Host "   Need to update environment variables in Render!" -ForegroundColor Yellow
    } else {
        Write-Host " ⚠️ UNKNOWN URL FORMAT" -ForegroundColor Yellow
        Write-Host "   Login URL: $($response.login_url)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing Main Backend..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "https://finanace-managment-app.onrender.com/api/mcp/initiate" -UseBasicParsing
    
    if ($response.login_url -like "*finanace-managment-app-1.onrender.com*") {
        Write-Host " ✅ FIXED - Using production URL" -ForegroundColor Green
    } else {
        Write-Host " ❌ STILL BROKEN - Using localhost" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

Write-Host "`n📋 Required Environment Variables for finanace-managment-app-2:" -ForegroundColor Cyan
Write-Host "PORT=5001"
Write-Host "NODE_ENV=production"
Write-Host "MCP_URL=https://finanace-managment-app-1.onrender.com/mcp/stream"
Write-Host "MCP_BASE_URL=https://finanace-managment-app-1.onrender.com"

Write-Host "`n🎯 Expected Result:" -ForegroundColor Green
Write-Host "Login URL should be: https://finanace-managment-app-1.onrender.com/mockWebPage?sessionId=..."
Write-Host "NOT: http://localhost:8080/mockWebPage?sessionId=..."

Write-Host "`n✅ Test complete!" -ForegroundColor Green
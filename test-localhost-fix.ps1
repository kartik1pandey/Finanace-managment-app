#!/usr/bin/env pwsh
# Test Localhost URL Fix

Write-Host "🧪 Testing Localhost URL Fix..." -ForegroundColor Green

Write-Host "`nTesting MCP Initiate..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "https://finanace-managment-app-2.onrender.com/mcp/initiate" -UseBasicParsing
    
    if ($response.login_url -like "*finanace-managment-app-1.onrender.com*") {
        Write-Host " ✅ FIXED!" -ForegroundColor Green
        Write-Host "   Login URL: $($response.login_url)" -ForegroundColor Blue
    } elseif ($response.login_url -like "*localhost*") {
        Write-Host " ❌ STILL BROKEN" -ForegroundColor Red
        Write-Host "   Login URL: $($response.login_url)" -ForegroundColor Red
    } else {
        Write-Host " ⚠️ UNKNOWN" -ForegroundColor Yellow
        Write-Host "   Login URL: $($response.login_url)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Expected Result:" -ForegroundColor Cyan
Write-Host "Login URL should be: https://finanace-managment-app-1.onrender.com/mockWebPage?sessionId=..."
Write-Host "NOT: http://localhost:ANY_PORT/mockWebPage?sessionId=..."

Write-Host "`n✅ Test complete!" -ForegroundColor Green
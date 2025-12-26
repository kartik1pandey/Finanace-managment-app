#!/usr/bin/env pwsh
# Test After Environment Variable Fix

Write-Host "Testing after Vercel environment variable fix..." -ForegroundColor Green

$FRONTEND = "https://finanace-managment-app-pd6j.vercel.app"
$BACKEND = "https://finanace-managment-app.onrender.com"

Write-Host "`nTesting backend API..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$BACKEND/api/mcp/initiate" -UseBasicParsing
    Write-Host " OK - Returns sessionId: $($response.sessionId.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host " FAIL" -ForegroundColor Red
}

Write-Host "`nNext steps:"
Write-Host "1. Visit: $FRONTEND"
Write-Host "2. Open browser console (F12)"
Write-Host "3. Click 'Connect Financial Accounts'"
Write-Host "4. Check Network tab - should call $BACKEND not localhost"
Write-Host "5. Should get session instead of JSON parse error"
#!/usr/bin/env pwsh
# Diagnose Frontend Connection Error

Write-Host "🔍 Diagnosing Frontend Connection Error..." -ForegroundColor Green

$FRONTEND = "https://finanace-managment-app-pd6j.vercel.app"
$BACKEND = "https://finanace-managment-app.onrender.com"

Write-Host "`n🧪 Testing API Endpoints:" -ForegroundColor Yellow

# Test 1: Direct backend API call
Write-Host "1. Testing backend API directly..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$BACKEND/api/mcp/initiate" -UseBasicParsing -TimeoutSec 30
    Write-Host " ✅ OK - Returns JSON" -ForegroundColor Green
    Write-Host "   Session ID: $($response.sessionId.Substring(0,20))..."
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: CORS preflight
Write-Host "2. Testing CORS headers..." -NoNewline
try {
    $headers = @{
        'Origin' = $FRONTEND
        'Access-Control-Request-Method' = 'GET'
        'Access-Control-Request-Headers' = 'Content-Type'
    }
    $response = Invoke-WebRequest -Uri "$BACKEND/api/mcp/initiate" -Method OPTIONS -Headers $headers -UseBasicParsing -TimeoutSec 30
    Write-Host " ✅ OK - CORS enabled" -ForegroundColor Green
} catch {
    Write-Host " ⚠️ CORS might be an issue" -ForegroundColor Yellow
}

# Test 3: Check if frontend is trying localhost
Write-Host "3. Testing localhost fallback..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/mcp/initiate" -UseBasicParsing -TimeoutSec 5
    Write-Host " ⚠️ Localhost is responding (shouldn't happen in production)" -ForegroundColor Yellow
} catch {
    Write-Host " ✅ OK - Localhost not accessible (expected)" -ForegroundColor Green
}

Write-Host "`n🔧 Likely Issues:" -ForegroundColor Cyan
Write-Host "1. Frontend environment variable NEXT_PUBLIC_BACKEND not set in Vercel"
Write-Host "2. Frontend is falling back to localhost:8000"
Write-Host "3. Network/DNS issues between frontend and backend"

Write-Host "`n📋 Required Vercel Environment Variables:" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_BACKEND=$BACKEND"
Write-Host "NEXT_PUBLIC_SUPABASE_URL=https://nmoybswrkmbcolvqkjjt.supabase.co"
Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
Write-Host "NEXT_PUBLIC_MCP_SERVER=https://finanace-managment-app-2.onrender.com"

Write-Host "`n🛠️ Fix Steps:" -ForegroundColor Red
Write-Host "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
Write-Host "2. Ensure NEXT_PUBLIC_BACKEND is set to: $BACKEND"
Write-Host "3. Redeploy the frontend"
Write-Host "4. Test again"

Write-Host "`n🧪 Test Frontend Environment:" -ForegroundColor Magenta
Write-Host "Visit: $FRONTEND"
Write-Host "Open browser console (F12) and check for:"
Write-Host "- Network requests going to localhost instead of $BACKEND"
Write-Host "- CORS errors"
Write-Host "- 404 errors"

Write-Host "`n✅ Diagnosis complete!" -ForegroundColor Green
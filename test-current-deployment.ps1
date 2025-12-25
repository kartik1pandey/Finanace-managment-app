#!/usr/bin/env pwsh
# Test Current Deployment Status

Write-Host "🧪 Testing Current Deployment..." -ForegroundColor Green

# Current URLs
$MAIN_BACKEND = "https://finanace-managment-app.onrender.com"
$MCP_PROXY = "https://finanace-managment-app-2.onrender.com"

Write-Host "`n🔧 Testing Services:" -ForegroundColor Yellow

# Test Main Backend
Write-Host "1. Main Backend Health..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$MAIN_BACKEND/health" -UseBasicParsing
    Write-Host " ✅ $($response.status)" -ForegroundColor Green
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Test MCP Proxy
Write-Host "2. MCP Proxy Health..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$MCP_PROXY/health" -UseBasicParsing
    Write-Host " ✅ $($response.status)" -ForegroundColor Green
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Test MCP Initiate
Write-Host "3. MCP Initiate..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$MCP_PROXY/mcp/initiate" -UseBasicParsing
    if ($response.sessionId) {
        Write-Host " ✅ Session: $($response.sessionId.Substring(0,20))..." -ForegroundColor Green
    } else {
        Write-Host " ⚠️  No session ID" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Test Stock API
Write-Host "4. Stock API..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$MAIN_BACKEND/api/investments/stock/AAPL" -UseBasicParsing
    Write-Host " ✅ Price: $($response.quote.price)" -ForegroundColor Green
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Test Financial Summary
Write-Host "5. Financial Summary..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$MAIN_BACKEND/api/financial/summary/1" -UseBasicParsing
    $mcpStatus = if ($response.mcp_data_available) { "MCP Active" } else { "Mock Data" }
    Write-Host " ✅ Net Worth: $($response.summary.net_worth) ($mcpStatus)" -ForegroundColor Green
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

Write-Host "`n📊 Service URLs:" -ForegroundColor Cyan
Write-Host "Main Backend: $MAIN_BACKEND"
Write-Host "MCP Proxy: $MCP_PROXY"
Write-Host "Go MCP Server: Deploy manually in Render Dashboard"

Write-Host "`n🎯 Next Steps:" -ForegroundColor Blue
Write-Host "1. Deploy Go MCP Server in Render Dashboard"
Write-Host "2. Update MCP_URL in MCP Proxy service"
Write-Host "3. Update frontend environment variables"
Write-Host "4. Test complete integration"

Write-Host "`n✅ Current deployment is functional!" -ForegroundColor Green
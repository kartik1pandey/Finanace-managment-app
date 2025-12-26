#!/usr/bin/env pwsh
# Test Updated Deployment with Correct Environment Variables

Write-Host "🔧 Testing Updated Deployment..." -ForegroundColor Green

# Updated Service URLs
$FRONTEND = "https://finanace-managment-app-pd6j.vercel.app"
$MAIN_BACKEND = "https://finanace-managment-app.onrender.com"
$GO_MCP_SERVER = "https://finanace-managment-app-1.onrender.com"
$NODE_MCP_PROXY = "https://finanace-managment-app-2.onrender.com"

Write-Host "`n🌐 Testing Services with Updated Environment Variables:" -ForegroundColor Cyan

function Test-Endpoint {
    param([string]$Name, [string]$Url)
    Write-Host "$Name..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri $Url -UseBasicParsing -TimeoutSec 30
        Write-Host " ✅ OK" -ForegroundColor Green
        return $response
    } catch {
        Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test all services
Write-Host "`n1. Health Checks:" -ForegroundColor Yellow
Test-Endpoint "Main Backend Health" "$MAIN_BACKEND/health"
Test-Endpoint "Go MCP Server Health" "$GO_MCP_SERVER/health"
Test-Endpoint "Node MCP Proxy Health" "$NODE_MCP_PROXY/health"
Test-Endpoint "Frontend" $FRONTEND

Write-Host "`n2. API Tests:" -ForegroundColor Yellow
$stockResponse = Test-Endpoint "Stock API" "$MAIN_BACKEND/api/investments/stock/AAPL"
$summaryResponse = Test-Endpoint "Financial Summary" "$MAIN_BACKEND/api/financial/summary/1"

Write-Host "`n3. MCP Integration:" -ForegroundColor Yellow
$mcpResponse = Test-Endpoint "MCP Initiate" "$NODE_MCP_PROXY/mcp/initiate"

if ($mcpResponse -and $mcpResponse.sessionId) {
    $sessionId = $mcpResponse.sessionId
    Write-Host "MCP NetWorth with Session..." -NoNewline
    try {
        $networthResponse = Invoke-RestMethod -Uri "$NODE_MCP_PROXY/mcp/networth?sessionId=$sessionId" -UseBasicParsing -TimeoutSec 30
        Write-Host " ✅ OK" -ForegroundColor Green
    } catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
}

Write-Host "`n4. Cross-Service Communication:" -ForegroundColor Yellow
if ($summaryResponse) {
    $mcpStatus = if ($summaryResponse.mcp_data_available) { "✅ Real MCP Data" } else { "⚠️ Mock Data" }
    Write-Host "Financial Summary MCP Status: $mcpStatus" -ForegroundColor White
    Write-Host "Net Worth: $($summaryResponse.summary.net_worth)" -ForegroundColor White
}

Write-Host "`n🎯 Service URLs:" -ForegroundColor Cyan
Write-Host "Frontend:      $FRONTEND"
Write-Host "Main Backend:  $MAIN_BACKEND"
Write-Host "Go MCP:        $GO_MCP_SERVER"
Write-Host "Node MCP:      $NODE_MCP_PROXY"

Write-Host "`n📋 Next Steps:" -ForegroundColor Blue
Write-Host "1. If any service fails, check Render/Vercel logs"
Write-Host "2. Ensure all environment variables are set correctly"
Write-Host "3. Wait 2-3 minutes after deployment for services to restart"
Write-Host "4. Test your frontend at: $FRONTEND"

Write-Host "`n✅ Testing complete!" -ForegroundColor Green
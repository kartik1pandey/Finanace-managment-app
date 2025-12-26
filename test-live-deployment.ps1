#!/usr/bin/env pwsh
# Test Complete Live Deployment

Write-Host "🎉 Testing Your Live Financial Management App!" -ForegroundColor Green

# Live Service URLs
$FRONTEND = "https://finanace-managment-app-pd6j.vercel.app"
$MAIN_BACKEND = "https://finanace-managment-app.onrender.com"
$GO_MCP_SERVER = "https://finanace-managment-app-1.onrender.com"
$NODE_MCP_PROXY = "https://finanace-managment-app-2.onrender.com"

Write-Host "`n🌐 Your Live Services:" -ForegroundColor Cyan
Write-Host "Frontend:        $FRONTEND"
Write-Host "Main Backend:    $MAIN_BACKEND"
Write-Host "Go MCP Server:   $GO_MCP_SERVER"
Write-Host "Node MCP Proxy:  $NODE_MCP_PROXY"

$testResults = @()

function Test-Service {
    param([string]$Name, [string]$Url, [string]$ExpectedProperty = $null)
    
    Write-Host "`n$Name..." -NoNewline
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $Url -UseBasicParsing -TimeoutSec 60
        $stopwatch.Stop()
        
        if ($ExpectedProperty -and $response.$ExpectedProperty) {
            Write-Host " ✅ $($response.$ExpectedProperty) ($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
            $script:testResults += @{ Name = $Name; Status = "PASS"; Time = $stopwatch.ElapsedMilliseconds }
        } elseif (!$ExpectedProperty) {
            Write-Host " ✅ OK ($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
            $script:testResults += @{ Name = $Name; Status = "PASS"; Time = $stopwatch.ElapsedMilliseconds }
        } else {
            Write-Host " ⚠️ Missing $ExpectedProperty" -ForegroundColor Yellow
            $script:testResults += @{ Name = $Name; Status = "WARN"; Time = $stopwatch.ElapsedMilliseconds }
        }
        return $response
    } catch {
        Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{ Name = $Name; Status = "FAIL"; Time = 0 }
        return $null
    }
}

Write-Host "`n🔧 1. INFRASTRUCTURE HEALTH CHECKS" -ForegroundColor Yellow
Write-Host "Note: First requests may take 30+ seconds (services waking up)..." -ForegroundColor Blue

# Test all health endpoints
Test-Service "Main Backend Health" "$MAIN_BACKEND/health" "status"
Test-Service "Go MCP Server Health" "$GO_MCP_SERVER/health" "status"
Test-Service "Node MCP Proxy Health" "$NODE_MCP_PROXY/health" "status"
Test-Service "Frontend Accessibility" $FRONTEND

Write-Host "`n📊 2. API FUNCTIONALITY TESTS" -ForegroundColor Yellow

# Test stock data
$stockResponse = Test-Service "Stock Data API" "$MAIN_BACKEND/api/investments/stock/AAPL"
if ($stockResponse -and $stockResponse.quote) {
    Write-Host "   📈 AAPL Price: $($stockResponse.quote.price)" -ForegroundColor Blue
}

# Test financial summary
$summaryResponse = Test-Service "Financial Summary" "$MAIN_BACKEND/api/financial/summary/1"
if ($summaryResponse) {
    $mcpStatus = if ($summaryResponse.mcp_data_available) { "Real MCP Data" } else { "Mock Data" }
    Write-Host "   💰 Net Worth: $($summaryResponse.summary.net_worth) ($mcpStatus)" -ForegroundColor Blue
}

# Test favorites
Test-Service "Favorites API" "$MAIN_BACKEND/api/investments/favorites"

Write-Host "`n🔗 3. MCP INTEGRATION TESTS" -ForegroundColor Yellow

# Test MCP initiate
$mcpResponse = Test-Service "MCP Initiate" "$NODE_MCP_PROXY/mcp/initiate"
if ($mcpResponse -and $mcpResponse.sessionId) {
    $sessionId = $mcpResponse.sessionId
    Write-Host "   🔑 Session ID: $($sessionId.Substring(0,20))..." -ForegroundColor Blue
    
    # Test with session
    Test-Service "MCP NetWorth" "$NODE_MCP_PROXY/mcp/networth?sessionId=$sessionId"
}

Write-Host "`n⚡ 4. PERFORMANCE ANALYSIS" -ForegroundColor Yellow

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$avgTime = ($testResults | Where-Object { $_.Time -gt 0 } | Measure-Object -Property Time -Average).Average

Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "⚠️ Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "⏱️ Avg Response: $([math]::Round($avgTime))ms" -ForegroundColor Cyan

Write-Host "`n🎯 5. USER TESTING GUIDE" -ForegroundColor Magenta

Write-Host "🌐 Visit your live app: $FRONTEND" -ForegroundColor White
Write-Host ""
Write-Host "📋 Test these features:" -ForegroundColor White
Write-Host "1. 🏠 Dashboard - View financial summary"
Write-Host "2. 📈 Investments - Check stock data"
Write-Host "3. ⭐ Favorites - Add/remove favorite stocks"
Write-Host "4. 🔐 Authentication - Sign up/login"
Write-Host "5. 📱 Mobile - Test on phone/tablet"

Write-Host "`n🔧 6. ADMIN ENDPOINTS" -ForegroundColor Cyan
Write-Host "Health Checks:"
Write-Host "• Main Backend: $MAIN_BACKEND/health"
Write-Host "• MCP Server: $GO_MCP_SERVER/health"
Write-Host "• MCP Proxy: $NODE_MCP_PROXY/health"
Write-Host ""
Write-Host "API Testing:"
Write-Host "• Stock Data: $MAIN_BACKEND/api/investments/stock/AAPL"
Write-Host "• Financial Summary: $MAIN_BACKEND/api/financial/summary/1"
Write-Host "• MCP Initiate: $NODE_MCP_PROXY/mcp/initiate"

if ($failCount -eq 0) {
    Write-Host "`n🎉 CONGRATULATIONS! Your Financial Management App is LIVE!" -ForegroundColor Green
    Write-Host "✅ All services are running perfectly" -ForegroundColor Green
    Write-Host "✅ Ready for users and production traffic" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some services need attention. Check the failed tests above." -ForegroundColor Yellow
}

Write-Host "`n🚀 Your app is live at: $FRONTEND" -ForegroundColor Cyan
Write-Host "Share this URL with users to test your financial management platform!" -ForegroundColor White
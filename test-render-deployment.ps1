#!/usr/bin/env pwsh
# Test Complete Render Deployment

Write-Host "🧪 Testing Complete Render Deployment..." -ForegroundColor Green

# Render Service URLs
$FRONTEND_URL = "https://your-project.vercel.app"  # Update with your Vercel URL
$MAIN_BACKEND_URL = "https://finanace-managment-app.onrender.com"
$MCP_PROXY_URL = "https://mcp-backend-proxy.onrender.com"
$MCP_SERVER_URL = "https://fi-mcp-server.onrender.com"

Write-Host "`n🌐 Testing Render Services:" -ForegroundColor Cyan
Write-Host "Main Backend: $MAIN_BACKEND_URL"
Write-Host "MCP Proxy: $MCP_PROXY_URL"
Write-Host "MCP Server: $MCP_SERVER_URL"
Write-Host "Frontend: $FRONTEND_URL"

$testResults = @()

# Test Function
function Test-RenderService {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [string]$ExpectedProperty = $null
    )
    
    Write-Host "`n$Name..." -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = 60  # Render services may take time to wake up
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod @params
        $stopwatch.Stop()
        
        if ($ExpectedProperty) {
            if ($response.$ExpectedProperty) {
                Write-Host " ✅ PASS ($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
                $script:testResults += @{ Name = $Name; Status = "PASS"; Time = $stopwatch.ElapsedMilliseconds; Details = $response.$ExpectedProperty }
            } else {
                Write-Host " ❌ FAIL - Missing $ExpectedProperty" -ForegroundColor Red
                $script:testResults += @{ Name = $Name; Status = "FAIL"; Time = $stopwatch.ElapsedMilliseconds; Details = "Missing $ExpectedProperty" }
            }
        } else {
            Write-Host " ✅ PASS ($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
            $script:testResults += @{ Name = $Name; Status = "PASS"; Time = $stopwatch.ElapsedMilliseconds; Details = "OK" }
        }
        
        return $response
    } catch {
        Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{ Name = $Name; Status = "FAIL"; Time = 0; Details = $_.Exception.Message }
        return $null
    }
}

Write-Host "`n🔧 1. RENDER SERVICE HEALTH CHECKS" -ForegroundColor Yellow
Write-Host "Note: First request may take 30+ seconds if service is sleeping..." -ForegroundColor Blue

# Test 1: Main Backend Health
Test-RenderService "Main Backend Health" "$MAIN_BACKEND_URL/health" -ExpectedProperty "status"

# Test 2: MCP Server Health
Test-RenderService "MCP Server Health" "$MCP_SERVER_URL/health" -ExpectedProperty "status"

# Test 3: MCP Proxy Health
Test-RenderService "MCP Proxy Health" "$MCP_PROXY_URL/health" -ExpectedProperty "status"

Write-Host "`n📊 2. API FUNCTIONALITY TESTS" -ForegroundColor Yellow

# Test 4: Stock Data API
Test-RenderService "Stock Data API" "$MAIN_BACKEND_URL/api/investments/stock/AAPL" -ExpectedProperty "quote"

# Test 5: Batch Stock API
$batchBody = @{ symbols = @("AAPL", "GOOGL", "MSFT") }
Test-RenderService "Batch Stock API" "$MAIN_BACKEND_URL/api/investments/stocks/batch" "POST" $batchBody -ExpectedProperty "success"

# Test 6: Financial Summary API
Test-RenderService "Financial Summary API" "$MAIN_BACKEND_URL/api/financial/summary/1" -ExpectedProperty "summary"

Write-Host "`n🔗 3. MCP INTEGRATION TESTS" -ForegroundColor Yellow

# Test 7: MCP Initiate
$mcpInitResponse = Test-RenderService "MCP Initiate" "$MCP_PROXY_URL/mcp/initiate" -ExpectedProperty "sessionId"

if ($mcpInitResponse -and $mcpInitResponse.sessionId) {
    $sessionId = $mcpInitResponse.sessionId
    Write-Host "   📝 Session ID: $sessionId" -ForegroundColor Blue
    
    # Test 8: MCP NetWorth with session
    Test-RenderService "MCP NetWorth" "$MCP_PROXY_URL/mcp/networth?sessionId=$sessionId"
} else {
    Write-Host "   ⚠️  Skipping session-based tests (no session ID)" -ForegroundColor Yellow
}

# Test 9: MCP Generic Call
$mcpCallBody = @{ tool = "fetch_net_worth"; args = @{} }
Test-RenderService "MCP Generic Call" "$MCP_PROXY_URL/mcp/call?sessionId=test" "POST" $mcpCallBody

Write-Host "`n⚡ 4. PERFORMANCE ANALYSIS" -ForegroundColor Yellow

$avgResponseTime = ($testResults | Where-Object { $_.Time -gt 0 } | Measure-Object -Property Time -Average).Average

if ($avgResponseTime -lt 1000) {
    Write-Host "Average Response Time: $([math]::Round($avgResponseTime))ms ✅ EXCELLENT" -ForegroundColor Green
} elseif ($avgResponseTime -lt 3000) {
    Write-Host "Average Response Time: $([math]::Round($avgResponseTime))ms ✅ GOOD" -ForegroundColor Green
} elseif ($avgResponseTime -lt 10000) {
    Write-Host "Average Response Time: $([math]::Round($avgResponseTime))ms ⚠️  ACCEPTABLE" -ForegroundColor Yellow
} else {
    Write-Host "Average Response Time: $([math]::Round($avgResponseTime))ms ❌ SLOW" -ForegroundColor Red
}

Write-Host "`n🌐 5. FRONTEND TEST" -ForegroundColor Yellow

if ($FRONTEND_URL -ne "https://your-project.vercel.app") {
    Test-RenderService "Frontend Accessibility" $FRONTEND_URL
} else {
    Write-Host "Frontend URL not configured - update script with your Vercel URL" -ForegroundColor Yellow
}

Write-Host "`n📋 6. TEST SUMMARY" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Your Render deployment is working perfectly!" -ForegroundColor Green
} elseif ($failCount -le 2) {
    Write-Host "`n⚠️  Most tests passed. Check the failed tests below." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Multiple tests failed. Review your Render deployment." -ForegroundColor Red
}

Write-Host "`n📊 Detailed Results:" -ForegroundColor White
foreach ($result in $testResults) {
    $status = if ($result.Status -eq "PASS") { "✅" } else { "❌" }
    $time = if ($result.Time -gt 0) { " ($($result.Time)ms)" } else { "" }
    Write-Host "$status $($result.Name)$time: $($result.Details)" -ForegroundColor White
}

Write-Host "`n🔧 Troubleshooting Tips:" -ForegroundColor Cyan
Write-Host "1. If services are slow, they may be sleeping (free tier limitation)"
Write-Host "2. Check Render dashboard for deployment logs"
Write-Host "3. Verify environment variables are set correctly"
Write-Host "4. Ensure all services are deployed and running"

Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
if ($failCount -eq 0) {
    Write-Host "✅ Your deployment is ready for production!"
    Write-Host "✅ All services are communicating properly"
    Write-Host "✅ Test your frontend manually at: $FRONTEND_URL"
} else {
    Write-Host "🔧 Fix the failed tests above"
    Write-Host "🔧 Check Render service logs"
    Write-Host "🔧 Verify environment variables"
}

Write-Host "`n✅ Testing complete!" -ForegroundColor Green
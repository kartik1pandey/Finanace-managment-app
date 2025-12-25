#!/usr/bin/env pwsh
# Comprehensive Full-Stack Deployment Test

Write-Host "🧪 Testing Complete Full-Stack Deployment..." -ForegroundColor Green

# Configuration - UPDATE THESE WITH YOUR ACTUAL URLS
$FRONTEND_URL = "https://your-project.vercel.app"
$MAIN_BACKEND_URL = "https://finanace-managment-app.onrender.com"
$MCP_PROXY_URL = "https://your-mcp-proxy.railway.app"
$MCP_SERVER_URL = "https://your-go-mcp-server.railway.app"

Write-Host "`n🌐 Testing URLs:" -ForegroundColor Cyan
Write-Host "Frontend: $FRONTEND_URL"
Write-Host "Main Backend: $MAIN_BACKEND_URL"
Write-Host "MCP Proxy: $MCP_PROXY_URL"
Write-Host "MCP Server: $MCP_SERVER_URL"

$testResults = @()

# Test Function
function Test-Endpoint {
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
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        
        if ($ExpectedProperty) {
            if ($response.$ExpectedProperty) {
                Write-Host " ✅ PASS" -ForegroundColor Green
                $script:testResults += @{ Name = $Name; Status = "PASS"; Details = $response.$ExpectedProperty }
            } else {
                Write-Host " ❌ FAIL - Missing $ExpectedProperty" -ForegroundColor Red
                $script:testResults += @{ Name = $Name; Status = "FAIL"; Details = "Missing $ExpectedProperty" }
            }
        } else {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $script:testResults += @{ Name = $Name; Status = "PASS"; Details = "OK" }
        }
        
        return $response
    } catch {
        Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{ Name = $Name; Status = "FAIL"; Details = $_.Exception.Message }
        return $null
    }
}

Write-Host "`n🔧 1. INFRASTRUCTURE TESTS" -ForegroundColor Yellow

# Test 1: Frontend Accessibility
Test-Endpoint "Frontend Health" $FRONTEND_URL

# Test 2: Main Backend Health
Test-Endpoint "Main Backend Health" "$MAIN_BACKEND_URL/health" -ExpectedProperty "status"

# Test 3: MCP Server Health (if deployed)
if ($MCP_SERVER_URL -ne "https://your-go-mcp-server.railway.app") {
    Test-Endpoint "MCP Server Health" "$MCP_SERVER_URL/health" -ExpectedProperty "status"
}

# Test 4: MCP Proxy Health (if deployed)
if ($MCP_PROXY_URL -ne "https://your-mcp-proxy.railway.app") {
    Test-Endpoint "MCP Proxy Health" "$MCP_PROXY_URL/health" -ExpectedProperty "status"
}

Write-Host "`n📊 2. API FUNCTIONALITY TESTS" -ForegroundColor Yellow

# Test 5: Stock Data API
Test-Endpoint "Stock Data API" "$MAIN_BACKEND_URL/api/investments/stock/AAPL" -ExpectedProperty "quote"

# Test 6: Batch Stock API
$batchBody = @{ symbols = @("AAPL", "GOOGL", "MSFT") }
Test-Endpoint "Batch Stock API" "$MAIN_BACKEND_URL/api/investments/stocks/batch" "POST" $batchBody -ExpectedProperty "success"

# Test 7: Favorites API
Test-Endpoint "Favorites API" "$MAIN_BACKEND_URL/api/investments/favorites" -ExpectedProperty "success"

# Test 8: Financial Summary API
Test-Endpoint "Financial Summary API" "$MAIN_BACKEND_URL/api/financial/summary/1" -ExpectedProperty "summary"

# Test 9: Chat API
$chatBody = @{ message = "Hello, test message"; user_id = 1 }
Test-Endpoint "Chat API" "$MAIN_BACKEND_URL/api/advisor/chat" "POST" $chatBody -ExpectedProperty "response"

Write-Host "`n🔗 3. MCP INTEGRATION TESTS" -ForegroundColor Yellow

if ($MCP_PROXY_URL -ne "https://your-mcp-proxy.railway.app") {
    # Test 10: MCP Initiate
    Test-Endpoint "MCP Initiate" "$MCP_PROXY_URL/mcp/initiate" -ExpectedProperty "sessionId"
    
    # Test 11: MCP NetWorth (might require login)
    $mcpResponse = Test-Endpoint "MCP NetWorth" "$MCP_PROXY_URL/mcp/networth?sessionId=test-session"
    
    if ($mcpResponse -and $mcpResponse.login_required) {
        Write-Host "   ℹ️  MCP requires login (expected for financial data)" -ForegroundColor Blue
    }
} else {
    Write-Host "MCP Services not deployed yet - skipping MCP tests" -ForegroundColor Yellow
}

Write-Host "`n⚡ 4. PERFORMANCE TESTS" -ForegroundColor Yellow

# Test 12: Response Time Test
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Invoke-RestMethod -Uri "$MAIN_BACKEND_URL/health" -UseBasicParsing | Out-Null
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 2000) {
        Write-Host "Response Time: ${responseTime}ms ✅ GOOD" -ForegroundColor Green
    } elseif ($responseTime -lt 5000) {
        Write-Host "Response Time: ${responseTime}ms ⚠️  ACCEPTABLE" -ForegroundColor Yellow
    } else {
        Write-Host "Response Time: ${responseTime}ms ❌ SLOW" -ForegroundColor Red
    }
} catch {
    Write-Host "Performance test failed" -ForegroundColor Red
}

Write-Host "`n📋 5. TEST SUMMARY" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Your deployment is working perfectly!" -ForegroundColor Green
} elseif ($failCount -le 2) {
    Write-Host "`n⚠️  Most tests passed. Check the failed tests above." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Multiple tests failed. Review your deployment configuration." -ForegroundColor Red
}

Write-Host "`n📊 Detailed Results:" -ForegroundColor White
foreach ($result in $testResults) {
    $status = if ($result.Status -eq "PASS") { "✅" } else { "❌" }
    Write-Host "$status $($result.Name): $($result.Details)" -ForegroundColor White
}

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
if ($MCP_PROXY_URL -eq "https://your-mcp-proxy.railway.app") {
    Write-Host "1. Deploy MCP services using: .\deploy-mcp-services.ps1"
    Write-Host "2. Update the URLs in this script"
    Write-Host "3. Re-run this test"
} else {
    Write-Host "1. Fix any failed tests"
    Write-Host "2. Update environment variables if needed"
    Write-Host "3. Test the frontend manually"
}

Write-Host "`n✅ Testing complete!" -ForegroundColor Green
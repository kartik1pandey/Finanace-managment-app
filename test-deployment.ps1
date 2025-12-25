#!/usr/bin/env pwsh
# Deployment Testing Script

Write-Host "🧪 Testing Complete Deployment..." -ForegroundColor Green

# Configuration
$BACKEND_URL = "https://finanace-managment-app.onrender.com"
$FRONTEND_URL = "https://your-project.vercel.app"  # Replace with your actual Vercel URL

Write-Host "`n📡 Testing Backend Services..." -ForegroundColor Yellow

# Test 1: Backend Health Check
Write-Host "1. Backend Health Check..." -NoNewline
try {
    $healthResponse = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET
    if ($healthResponse.status -eq "healthy") {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Status: $($healthResponse.status)"
        Write-Host "   Service: $($healthResponse.service)"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Stock Data API
Write-Host "2. Stock Data API..." -NoNewline
try {
    $stockResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/investments/stock/AAPL" -Method GET
    if ($stockResponse.quote.symbol -eq "AAPL") {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Symbol: $($stockResponse.quote.symbol)"
        Write-Host "   Price: $($stockResponse.quote.price)"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Batch Stock API
Write-Host "3. Batch Stock API..." -NoNewline
try {
    $batchBody = @{
        symbols = @("AAPL", "GOOGL", "MSFT")
    } | ConvertTo-Json
    
    $batchResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/investments/stocks/batch" -Method POST -Body $batchBody -ContentType "application/json"
    if ($batchResponse.success -eq $true) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Stocks returned: $($batchResponse.data.Count)"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Favorites API
Write-Host "4. Favorites API..." -NoNewline
try {
    $favoritesResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/investments/favorites" -Method GET
    if ($favoritesResponse.success -eq $true) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Favorites count: $($favoritesResponse.favorites.Count)"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Financial Summary API
Write-Host "5. Financial Summary API..." -NoNewline
try {
    $summaryResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/financial/summary/1" -Method GET
    if ($summaryResponse.summary) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Net Worth: $($summaryResponse.summary.net_worth)"
        Write-Host "   Savings Rate: $($summaryResponse.summary.savings_rate)%"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Chat API
Write-Host "6. Chat API..." -NoNewline
try {
    $chatBody = @{
        message = "Hello, test message"
        user_id = 1
    } | ConvertTo-Json
    
    $chatResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/advisor/chat" -Method POST -Body $chatBody -ContentType "application/json"
    if ($chatResponse.response) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Response length: $($chatResponse.response.Length) chars"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🌐 Testing Frontend..." -ForegroundColor Yellow

# Test 7: Frontend Accessibility
Write-Host "7. Frontend Accessibility..." -NoNewline
try {
    $frontendResponse = Invoke-WebRequest -Uri $FRONTEND_URL -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   Status Code: $($frontendResponse.StatusCode)"
        Write-Host "   Content Length: $($frontendResponse.Content.Length) bytes"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Deployment Test Summary:" -ForegroundColor Cyan
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor White
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor White
Write-Host "`n✅ All tests completed!" -ForegroundColor Green
Write-Host "If any tests failed, check the deployment logs and environment variables." -ForegroundColor Yellow

# Performance test
Write-Host "`n⚡ Performance Test..." -ForegroundColor Magenta
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET | Out-Null
    $stopwatch.Stop()
    Write-Host "Backend response time: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
} catch {
    Write-Host "Performance test failed" -ForegroundColor Red
}

Write-Host "`n🎉 Deployment testing complete!" -ForegroundColor Green
#!/usr/bin/env pwsh
# Test Render Services Status

Write-Host "🔍 Testing Render Services Status..." -ForegroundColor Green

$services = @{
    "Main Backend" = "https://finanace-managment-app.onrender.com"
    "Go MCP Server" = "https://finanace-managment-app-1.onrender.com"
    "Node.js MCP Proxy" = "https://finanace-managment-app-2.onrender.com"
}

foreach ($service in $services.GetEnumerator()) {
    Write-Host "`n$($service.Key):" -ForegroundColor Yellow
    
    # Test health endpoint
    Write-Host "  Health check..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri "$($service.Value)/health" -UseBasicParsing -TimeoutSec 30
        Write-Host " ✅ OK" -ForegroundColor Green
        if ($response.status) {
            Write-Host "    Status: $($response.status)" -ForegroundColor Blue
        }
        if ($response.service) {
            Write-Host "    Service: $($response.service)" -ForegroundColor Blue
        }
    } catch {
        Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test root endpoint
    Write-Host "  Root endpoint..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $service.Value -UseBasicParsing -TimeoutSec 30
        Write-Host " ✅ OK (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🧪 Testing MCP Integration:" -ForegroundColor Cyan

Write-Host "MCP Initiate..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "https://finanace-managment-app-2.onrender.com/mcp/initiate" -UseBasicParsing -TimeoutSec 30
    Write-Host " ✅ OK" -ForegroundColor Green
    
    if ($response.login_url) {
        if ($response.login_url -like "*finanace-managment-app-1.onrender.com*") {
            Write-Host "  ✅ Login URL uses production server" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Login URL still uses localhost: $($response.login_url)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Service Status Summary:" -ForegroundColor White
Write-Host "- If Go MCP Server fails: Check deployment logs in Render"
Write-Host "- If Node.js Proxy fails: Check PORT binding and environment variables"
Write-Host "- If Main Backend fails: Check Python dependencies"

Write-Host "`n✅ Test complete!" -ForegroundColor Green
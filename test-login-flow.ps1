#!/usr/bin/env pwsh
# Test Complete MCP Login Flow

Write-Host "🧪 Testing Complete MCP Login Flow..." -ForegroundColor Green

Write-Host "`n1. Testing MCP Initiate..." -NoNewline
try {
    $initResponse = Invoke-RestMethod -Uri "https://finanace-managment-app.onrender.com/api/mcp/initiate" -UseBasicParsing
    Write-Host " ✅ OK" -ForegroundColor Green
    
    if ($initResponse.sessionId) {
        $sessionId = $initResponse.sessionId
        Write-Host "   Session ID: $($sessionId.Substring(0,20))..." -ForegroundColor Blue
        Write-Host "   Login Required: $($initResponse.login_required)" -ForegroundColor Blue
        Write-Host "   Login URL: $($initResponse.login_url)" -ForegroundColor Blue
        
        Write-Host "`n2. Testing Login Status Check..." -NoNewline
        try {
            $statusResponse = Invoke-RestMethod -Uri "https://finanace-managment-app.onrender.com/api/mcp/login-status?session_id=$sessionId" -UseBasicParsing
            Write-Host " ✅ OK" -ForegroundColor Green
            
            Write-Host "   Login Required: $($statusResponse.login_required)" -ForegroundColor Blue
            Write-Host "   Has Result: $($statusResponse.result -ne $null)" -ForegroundColor Blue
            
            if (!$statusResponse.login_required -and $statusResponse.result) {
                Write-Host "   🎉 LOGIN SUCCESS DETECTED!" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Login not completed yet (expected before actual login)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Login Flow:" -ForegroundColor Cyan
Write-Host "1. Click 'Connect Financial Accounts'"
Write-Host "2. Click 'Open Login Page' → Goes to production server"
Write-Host "3. Enter phone: 2222222222, OTP: any 6 digits"
Write-Host "4. Return to frontend, click 'I've Completed Login'"
Write-Host "5. Should redirect to dashboard"

Write-Host "`n🎯 Expected After Login:" -ForegroundColor Green
Write-Host "login_required: false"
Write-Host "result: [financial data object]"

Write-Host "`n✅ Test complete!" -ForegroundColor Green
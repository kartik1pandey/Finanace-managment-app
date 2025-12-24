# Local Testing Script
# Test all services locally before deployment

Write-Host "🧪 Local Testing Script" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

# Function to test if port is available
function Test-Port {
    param($Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to start service in background
function Start-Service {
    param($Name, $Command, $Directory, $Port)
    
    Write-Host "🚀 Starting $Name..." -ForegroundColor Cyan
    
    if ($Directory) {
        Push-Location $Directory
    }
    
    if (Test-Port $Port) {
        Write-Host "⚠️  Port $Port is already in use. $Name might already be running." -ForegroundColor Yellow
    } else {
        Write-Host "📍 Running: $Command" -ForegroundColor Gray
        Write-Host "🔗 Will be available at: http://localhost:$Port" -ForegroundColor Gray
        Write-Host "💡 Open a new terminal and run: $Command" -ForegroundColor Yellow
    }
    
    if ($Directory) {
        Pop-Location
    }
    
    Write-Host ""
}

# Test all services
function Test-AllServices {
    Write-Host "🔍 Testing Local Development Setup" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if all directories exist
    $directories = @(".", "backend", "mcp-server")
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            Write-Host "✅ Directory '$dir' exists" -ForegroundColor Green
        } else {
            Write-Host "❌ Directory '$dir' missing" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🚀 To start all services, open 4 separate terminals and run:" -ForegroundColor Yellow
    Write-Host ""
    
    # Frontend
    Write-Host "📱 Terminal 1 - Frontend (Next.js):" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host "   → http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    
    # Backend
    Write-Host "🔧 Terminal 2 - Backend (FastAPI):" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   uvicorn main:app --reload" -ForegroundColor Gray
    Write-Host "   → http://localhost:8000" -ForegroundColor Green
    Write-Host ""
    
    # MCP Server
    Write-Host "🔗 Terminal 3 - MCP Server (Go):" -ForegroundColor White
    Write-Host "   cd mcp-server" -ForegroundColor Gray
    Write-Host "   go run ." -ForegroundColor Gray
    Write-Host "   → http://localhost:5001" -ForegroundColor Green
    Write-Host ""
    
    # JavaScript Service
    Write-Host "⚡ Terminal 4 - JavaScript Service:" -ForegroundColor White
    Write-Host "   npm start" -ForegroundColor Gray
    Write-Host "   → http://localhost:3001" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🧪 Testing URLs:" -ForegroundColor Cyan
    Write-Host "• Frontend: http://localhost:3000" -ForegroundColor Gray
    Write-Host "• Backend Health: http://localhost:8000/health" -ForegroundColor Gray
    Write-Host "• MCP Health: http://localhost:5001/health" -ForegroundColor Gray
    Write-Host "• API Docs: http://localhost:8000/docs" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📋 Testing Checklist:" -ForegroundColor Yellow
    Write-Host "□ All services start without errors" -ForegroundColor Gray
    Write-Host "□ Frontend loads at localhost:3000" -ForegroundColor Gray
    Write-Host "□ Backend health check passes" -ForegroundColor Gray
    Write-Host "□ Authentication works (sign up/login)" -ForegroundColor Gray
    Write-Host "□ Favorite stocks can be added/removed" -ForegroundColor Gray
    Write-Host "□ Data persists after refresh" -ForegroundColor Gray
    Write-Host "□ No console errors in browser" -ForegroundColor Gray
    Write-Host ""
}

# Check dependencies
function Test-Dependencies {
    Write-Host "🔍 Checking Dependencies..." -ForegroundColor Cyan
    
    $deps = @(
        @{Name="Node.js"; Command="node"; Args="--version"},
        @{Name="npm"; Command="npm"; Args="--version"},
        @{Name="Python"; Command="python"; Args="--version"},
        @{Name="Go"; Command="go"; Args="version"}
    )
    
    foreach ($dep in $deps) {
        try {
            $version = & $dep.Command $dep.Args 2>$null
            Write-Host "✅ $($dep.Name): $version" -ForegroundColor Green
        } catch {
            Write-Host "❌ $($dep.Name): Not installed or not in PATH" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Main execution
Test-Dependencies
Test-AllServices

Write-Host "💡 Pro Tips:" -ForegroundColor Cyan
Write-Host "• Use Ctrl+C to stop services" -ForegroundColor Gray
Write-Host "• Check logs in each terminal for errors" -ForegroundColor Gray
Write-Host "• Test in incognito mode to avoid cache issues" -ForegroundColor Gray
Write-Host "• Use browser dev tools to debug API calls" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Ready for deployment? Run: .\deploy.ps1" -ForegroundColor Green
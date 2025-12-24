# PowerShell Deployment Script for Windows
# Finance Dashboard Deployment

Write-Host "🚀 Finance Dashboard Deployment Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Function to print colored output
function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check dependencies
function Test-Dependencies {
    Write-Host "🔍 Checking dependencies..." -ForegroundColor Cyan
    
    $dependencies = @("git", "node", "python", "go")
    $missing = @()
    
    foreach ($dep in $dependencies) {
        if (!(Get-Command $dep -ErrorAction SilentlyContinue)) {
            $missing += $dep
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "Missing dependencies: $($missing -join ', ')"
        Write-Host "Please install the missing dependencies and try again." -ForegroundColor Red
        exit 1
    }
    
    Write-Success "All dependencies are installed"
}

# Build and test locally
function Build-AndTest {
    Write-Host "🔨 Building and testing locally..." -ForegroundColor Cyan
    
    # Test frontend build
    Write-Warning "Building frontend..."
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend build successful"
    } else {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    # Test backend
    Write-Warning "Testing backend..."
    Push-Location backend
    python -c "import fastapi, uvicorn; print('Backend dependencies OK')"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend dependencies OK"
    } else {
        Write-Error "Backend dependencies missing"
        Write-Host "Run: pip install -r requirements.txt" -ForegroundColor Yellow
    }
    Pop-Location
    
    # Test MCP server
    Write-Warning "Testing MCP server..."
    if (Test-Path "mcp-server") {
        Push-Location mcp-server
        go version
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Go environment OK"
        } else {
            Write-Warning "Go environment issues"
        }
        Pop-Location
    } else {
        Write-Warning "MCP server directory not found"
    }
}

# Show deployment instructions
function Show-DeploymentInstructions {
    Write-Host "🌐 Deployment Instructions" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "📋 Manual Deployment Steps:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "1. 📱 Frontend (Vercel):" -ForegroundColor White
    Write-Host "   • Go to https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host "   • Click 'New Project'" -ForegroundColor Gray
    Write-Host "   • Import your GitHub repository" -ForegroundColor Gray
    Write-Host "   • Set environment variables (see .env.production)" -ForegroundColor Gray
    Write-Host "   • Deploy automatically" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "2. 🔧 Backend (Railway):" -ForegroundColor White
    Write-Host "   • Go to https://railway.app/dashboard" -ForegroundColor Gray
    Write-Host "   • Create new project from GitHub" -ForegroundColor Gray
    Write-Host "   • Set root directory to 'backend'" -ForegroundColor Gray
    Write-Host "   • Add environment variables" -ForegroundColor Gray
    Write-Host "   • Deploy automatically" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "3. 🔗 MCP Server (Railway):" -ForegroundColor White
    Write-Host "   • Create another Railway project" -ForegroundColor Gray
    Write-Host "   • Same repository, set root to 'mcp-server'" -ForegroundColor Gray
    Write-Host "   • Configure Go build settings" -ForegroundColor Gray
    Write-Host "   • Deploy" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "4. 🗄️ Database (Supabase):" -ForegroundColor White
    Write-Host "   • Run SQL migration in Supabase dashboard" -ForegroundColor Gray
    Write-Host "   • File: supabase_migrations/create_favorite_stocks_table.sql" -ForegroundColor Gray
    Write-Host ""
}

# Show environment variables
function Show-EnvironmentVariables {
    Write-Host "🔧 Environment Variables Setup" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📋 Vercel (Frontend):" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_SUPABASE_URL=https://nmoybswrkmbcolvqkjjt.supabase.co" -ForegroundColor Gray
    Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Gray
    Write-Host "NEXT_PUBLIC_BACKEND=https://your-backend.railway.app" -ForegroundColor Gray
    Write-Host "NEXT_PUBLIC_MCP_SERVER=https://your-mcp-server.railway.app" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📋 Railway Backend:" -ForegroundColor Yellow
    Write-Host "SUPABASE_URL=https://nmoybswrkmbcolvqkjjt.supabase.co" -ForegroundColor Gray
    Write-Host "SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Gray
    Write-Host "GROQ_API_KEY=your_groq_api_key" -ForegroundColor Gray
    Write-Host "FRONTEND_URL=https://your-project.vercel.app" -ForegroundColor Gray
    Write-Host "PORT=8000" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📋 Railway MCP Server:" -ForegroundColor Yellow
    Write-Host "PORT=5001" -ForegroundColor Gray
    Write-Host "BACKEND_URL=https://your-backend.railway.app" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
function Main {
    try {
        Test-Dependencies
        Build-AndTest
        Show-DeploymentInstructions
        Show-EnvironmentVariables
        
        Write-Success "Deployment preparation complete!"
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Push your code to GitHub: git push origin main" -ForegroundColor Gray
        Write-Host "2. Follow the deployment steps above" -ForegroundColor Gray
        Write-Host "3. Update environment variables with production URLs" -ForegroundColor Gray
        Write-Host "4. Test all services are working together" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
        
    } catch {
        Write-Error "Deployment preparation failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Main
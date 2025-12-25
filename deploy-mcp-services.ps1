#!/usr/bin/env pwsh
# Deploy MCP Services to Railway

Write-Host "🚀 Deploying MCP Services to Railway..." -ForegroundColor Green

Write-Host "`n📋 Prerequisites:" -ForegroundColor Yellow
Write-Host "1. Railway CLI installed: npm install -g @railway/cli"
Write-Host "2. Railway account logged in: railway login"
Write-Host "3. Two Railway projects created:"
Write-Host "   - fi-mcp-server (Go service)"
Write-Host "   - mcp-backend-proxy (Node.js service)"

Write-Host "`n🔧 Manual Deployment Steps:" -ForegroundColor Cyan

Write-Host "`n1️⃣ Deploy Go MCP Server:" -ForegroundColor White
Write-Host "   cd fi-mcp-dev"
Write-Host "   railway login"
Write-Host "   railway link [your-go-mcp-project-id]"
Write-Host "   railway up"
Write-Host "   # Note the deployed URL (e.g., https://fi-mcp-server.railway.app)"

Write-Host "`n2️⃣ Deploy Node.js MCP Proxy:" -ForegroundColor White
Write-Host "   cd mcp-test/backend"
Write-Host "   railway login"
Write-Host "   railway link [your-node-mcp-project-id]"
Write-Host "   # Set environment variable:"
Write-Host "   railway variables set MCP_URL=https://your-go-mcp-server.railway.app/mcp/stream"
Write-Host "   railway up"
Write-Host "   # Note the deployed URL (e.g., https://mcp-proxy.railway.app)"

Write-Host "`n3️⃣ Update Main Backend:" -ForegroundColor White
Write-Host "   # Go to Render Dashboard"
Write-Host "   # Add environment variable:"
Write-Host "   # MCP_SERVER_URL=https://your-mcp-proxy.railway.app"
Write-Host "   # Redeploy the main backend"

Write-Host "`n4️⃣ Update Frontend:" -ForegroundColor White
Write-Host "   # Go to Vercel Dashboard"
Write-Host "   # Add environment variable:"
Write-Host "   # NEXT_PUBLIC_MCP_SERVER=https://your-mcp-proxy.railway.app"
Write-Host "   # Redeploy frontend"

Write-Host "`n🧪 Testing Commands:" -ForegroundColor Magenta
Write-Host "# Test Go MCP Server"
Write-Host "curl https://your-go-mcp-server.railway.app/health"
Write-Host ""
Write-Host "# Test Node.js MCP Proxy"
Write-Host "curl https://your-mcp-proxy.railway.app/health"
Write-Host ""
Write-Host "# Test MCP Integration"
Write-Host "curl https://your-mcp-proxy.railway.app/mcp/initiate"

Write-Host "`n📊 Expected Architecture:" -ForegroundColor Green
Write-Host "Frontend (Vercel) → Main Backend (Render) → MCP Proxy (Railway) → MCP Server (Railway)"

Write-Host "`n💡 Alternative: Use Railway for All Services" -ForegroundColor Yellow
Write-Host "If you prefer, you can deploy all services to Railway:"
Write-Host "- Main Backend (Python FastAPI)"
Write-Host "- MCP Server (Go)"
Write-Host "- MCP Proxy (Node.js)"
Write-Host "This would provide better integration and consistent networking."

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create Railway projects for both MCP services"
Write-Host "2. Deploy using the commands above"
Write-Host "3. Update environment variables in all services"
Write-Host "4. Run the comprehensive test script"

Write-Host "`n✅ Ready to deploy! Follow the manual steps above." -ForegroundColor Green
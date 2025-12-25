#!/usr/bin/env pwsh
# Deploy MCP Services to Render

Write-Host "🚀 Deploying MCP Services to Render..." -ForegroundColor Green

Write-Host "`n📋 Prerequisites:" -ForegroundColor Yellow
Write-Host "1. Render account at https://render.com"
Write-Host "2. GitHub repository with latest code pushed"
Write-Host "3. Two new Render services to be created"

Write-Host "`n🔧 Manual Deployment Steps:" -ForegroundColor Cyan

Write-Host "`n1️⃣ Deploy Go MCP Server:" -ForegroundColor White
Write-Host "   1. Go to https://dashboard.render.com"
Write-Host "   2. Click 'New +' → 'Web Service'"
Write-Host "   3. Connect your GitHub repository"
Write-Host "   4. Configure:"
Write-Host "      - Name: fi-mcp-server"
Write-Host "      - Root Directory: fi-mcp-dev"
Write-Host "      - Environment: Docker"
Write-Host "      - Plan: Free"
Write-Host "      - Auto-Deploy: Yes"
Write-Host "   5. Environment Variables:"
Write-Host "      PORT = 8080"
Write-Host "      GO_ENV = production"
Write-Host "   6. Deploy!"

Write-Host "`n2️⃣ Deploy Node.js MCP Proxy:" -ForegroundColor White
Write-Host "   1. Click 'New +' → 'Web Service'"
Write-Host "   2. Connect same GitHub repository"
Write-Host "   3. Configure:"
Write-Host "      - Name: mcp-backend-proxy"
Write-Host "      - Root Directory: mcp-test/backend"
Write-Host "      - Environment: Docker"
Write-Host "      - Plan: Free"
Write-Host "      - Auto-Deploy: Yes"
Write-Host "   4. Environment Variables:"
Write-Host "      PORT = 5001"
Write-Host "      NODE_ENV = production"
Write-Host "      MCP_URL = https://fi-mcp-server.onrender.com/mcp/stream"
Write-Host "   5. Deploy!"

Write-Host "`n3️⃣ Update Main Backend:" -ForegroundColor White
Write-Host "   1. Go to your main backend service in Render"
Write-Host "   2. Environment → Add Variable:"
Write-Host "      MCP_SERVER_URL = https://mcp-backend-proxy.onrender.com"
Write-Host "   3. Manual Deploy"

Write-Host "`n4️⃣ Update Frontend (Vercel):" -ForegroundColor White
Write-Host "   1. Go to Vercel Dashboard"
Write-Host "   2. Project Settings → Environment Variables"
Write-Host "   3. Add:"
Write-Host "      NEXT_PUBLIC_MCP_SERVER = https://mcp-backend-proxy.onrender.com"
Write-Host "   4. Redeploy"

Write-Host "`n🧪 Testing Commands:" -ForegroundColor Magenta
Write-Host "# Test Go MCP Server"
Write-Host "curl https://fi-mcp-server.onrender.com/health"
Write-Host ""
Write-Host "# Test Node.js MCP Proxy"
Write-Host "curl https://mcp-backend-proxy.onrender.com/health"
Write-Host ""
Write-Host "# Test MCP Integration"
Write-Host "curl https://mcp-backend-proxy.onrender.com/mcp/initiate"

Write-Host "`n📊 Expected Architecture:" -ForegroundColor Green
Write-Host "Frontend (Vercel)"
Write-Host "    ↓"
Write-Host "Main Backend (Render)"
Write-Host "    ↓"
Write-Host "MCP Proxy (Render) ← Deploy this"
Write-Host "    ↓"
Write-Host "MCP Server (Render) ← Deploy this"

Write-Host "`n💡 Render Service URLs:" -ForegroundColor Yellow
Write-Host "Go MCP Server: https://fi-mcp-server.onrender.com"
Write-Host "Node.js Proxy: https://mcp-backend-proxy.onrender.com"
Write-Host "Main Backend: https://finanace-managment-app.onrender.com"

Write-Host "`n⚠️  Important Notes:" -ForegroundColor Red
Write-Host "1. Free tier services sleep after 15 minutes of inactivity"
Write-Host "2. First request after sleep takes ~30 seconds to wake up"
Write-Host "3. Deploy Go MCP Server FIRST, then Node.js Proxy"
Write-Host "4. Update MCP_URL in Node.js service after Go server is deployed"

Write-Host "`n🎯 Deployment Order:" -ForegroundColor Cyan
Write-Host "1. Deploy Go MCP Server → Get URL"
Write-Host "2. Deploy Node.js Proxy → Use Go server URL"
Write-Host "3. Update main backend → Use proxy URL"
Write-Host "4. Update frontend → Use proxy URL"
Write-Host "5. Test everything"

Write-Host "`n✅ Ready to deploy! Follow the manual steps above." -ForegroundColor Green
Write-Host "After deployment, run: .\test-render-deployment.ps1" -ForegroundColor Blue
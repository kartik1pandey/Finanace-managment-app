# 🚂 Railway Deployment Guide for MCP Services

## 📋 Overview

We'll deploy two MCP services to Railway:
1. **Go MCP Server** (`fi-mcp-dev`) - Core financial data service
2. **Node.js MCP Proxy** (`mcp-test/backend`) - API proxy/wrapper

## 🔧 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: `npm install -g @railway/cli`
3. **GitHub Repository**: Your code should be pushed to GitHub

## 🚀 Deployment Steps

### Step 1: Deploy Go MCP Server

1. **Create Railway Project**:
   ```bash
   cd fi-mcp-dev
   railway login
   railway init
   # Choose "Empty Project"
   # Name it: "fi-mcp-server"
   ```

2. **Deploy**:
   ```bash
   railway up
   ```

3. **Get the URL**:
   - Go to Railway Dashboard
   - Click your project → Settings → Domains
   - Note the URL (e.g., `https://fi-mcp-server-production.up.railway.app`)

### Step 2: Deploy Node.js MCP Proxy

1. **Create Railway Project**:
   ```bash
   cd mcp-test/backend
   railway login
   railway init
   # Choose "Empty Project"  
   # Name it: "mcp-backend-proxy"
   ```

2. **Set Environment Variables**:
   ```bash
   # Replace with your actual Go MCP Server URL
   railway variables set MCP_URL=https://your-go-mcp-server.railway.app/mcp/stream
   railway variables set PORT=5001
   ```

3. **Deploy**:
   ```bash
   railway up
   ```

4. **Get the URL**:
   - Note the URL (e.g., `https://mcp-proxy-production.up.railway.app`)

### Step 3: Update Main Backend (Render)

1. **Go to Render Dashboard**
2. **Select your backend service**
3. **Environment → Add Variable**:
   ```
   MCP_SERVER_URL = https://your-mcp-proxy.railway.app
   ```
4. **Redeploy**

### Step 4: Update Frontend (Vercel)

1. **Go to Vercel Dashboard**
2. **Select your project → Settings → Environment Variables**
3. **Add**:
   ```
   NEXT_PUBLIC_MCP_SERVER = https://your-mcp-proxy.railway.app
   ```
4. **Redeploy**

## 🧪 Testing

Run the comprehensive test:
```powershell
# Update URLs in the script first
.\test-full-deployment.ps1
```

## 📊 Expected Architecture

```
Frontend (Vercel)
    ↓
Main Backend (Render)
    ↓
MCP Proxy (Railway) ← You deploy this
    ↓
MCP Server (Railway) ← You deploy this
```

## 🔍 Health Check URLs

After deployment, these should work:
- Go MCP Server: `https://your-go-mcp-server.railway.app/health`
- Node.js Proxy: `https://your-mcp-proxy.railway.app/health`
- MCP Initiate: `https://your-mcp-proxy.railway.app/mcp/initiate`

## 💰 Cost

Railway Free Tier:
- **$5 credit per month**
- **500 hours execution time**
- **1GB RAM per service**
- **1GB disk per service**

For two small services, this should be sufficient for development/testing.

## 🐛 Troubleshooting

### Common Issues

**1. Build Failures**
- Check Dockerfile syntax
- Ensure all dependencies are in go.mod/package.json
- Check Railway build logs

**2. Service Not Starting**
- Verify health check endpoints
- Check environment variables
- Review Railway deployment logs

**3. Connection Issues**
- Ensure MCP_URL points to correct Railway URL
- Check CORS settings
- Verify all services are running

### Debug Commands

```bash
# Check Railway service status
railway status

# View logs
railway logs

# Connect to service shell
railway shell

# Check environment variables
railway variables
```

## 🎯 Success Criteria

✅ **Go MCP Server**:
- Health endpoint returns 200
- Responds to MCP protocol requests
- Logs show successful startup

✅ **Node.js MCP Proxy**:
- Health endpoint returns service info
- `/mcp/initiate` returns sessionId
- Successfully proxies to Go server

✅ **Integration**:
- Main backend can reach MCP proxy
- Frontend can trigger MCP calls
- End-to-end data flow works

## 🔄 Alternative: Deploy All to Railway

If you prefer consistency, you can move your main backend from Render to Railway too:

1. Create new Railway project for main backend
2. Add all environment variables
3. Deploy Python FastAPI service
4. Update frontend to point to new Railway URL

This provides better networking between services and unified management.

## 📞 Support

If you encounter issues:
1. Check Railway documentation
2. Review deployment logs
3. Test each service individually
4. Verify environment variables

Ready to deploy? Start with Step 1! 🚀
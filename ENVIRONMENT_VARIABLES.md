# 🔧 Environment Variables Configuration

## 1. Vercel (Frontend)
**Dashboard**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://nmoybswrkmbcolvqkjjt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tb3lic3dya21iY29sdnFramp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDUxMTUsImV4cCI6MjA3ODcyMTExNX0.frXCjdayYtVQ4Tz35AO6EOfpx7WxU-7YqpABhBBba6w
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tb3lic3dya21iY29sdnFramp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDUxMTUsImV4cCI6MjA3ODcyMTExNX0.frXCjdayYtVQ4Tz35AO6EOfpx7WxU-7YqpABhBBba6w
NEXT_PUBLIC_OPENROUTER_API_KEY=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
NEXT_PUBLIC_BACKEND=https://finanace-managment-app.onrender.com
NEXT_PUBLIC_MCP_SERVER=https://finanace-managment-app-2.onrender.com
```

## 2. Main Backend (Render)
**Service**: `finanace-managment-app` → Environment

```
PORT=8000
PYTHON_VERSION=3.11.9
SUPABASE_URL=https://nmoybswrkmbcolvqkjjt.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tb3lic3dya21iY29sdnFramp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDUxMTUsImV4cCI6MjA3ODcyMTExNX0.frXCjdayYtVQ4Tz35AO6EOfpx7WxU-7YqpABhBBba6w
MCP_SERVER_URL=https://finanace-managment-app-2.onrender.com
FRONTEND_URL=https://finanace-managment-app-pd6j.vercel.app
ENVIRONMENT=production
```

## 3. Go MCP Server (Render)
**Service**: `finanace-managment-app-1` → Environment

```
PORT=8080
GO_ENV=production
```

## 4. Node.js MCP Proxy (Render)
**Service**: `finanace-managment-app-2` → Environment

```
PORT=5001
NODE_ENV=production
MCP_URL=https://finanace-managment-app-1.onrender.com/mcp/stream
```

## 🔄 Update Process

### Step 1: Update All Environment Variables
1. **Vercel**: Add all frontend variables
2. **Render Services**: Add backend variables to each service
3. **Manual Deploy**: Trigger redeploy for each service

### Step 2: Wait for Deployments
- Allow 2-3 minutes for each service to restart
- Check deployment logs for any errors

### Step 3: Test Integration
```powershell
.\test-updated-deployment.ps1
```

## 🎯 Expected Results

After updating all environment variables:
- ✅ Frontend connects to correct backend
- ✅ Backend connects to MCP proxy
- ✅ MCP proxy connects to Go server
- ✅ All services communicate properly
- ✅ Real financial data integration works

## 🌐 Live URLs

- **Frontend**: https://finanace-managment-app-pd6j.vercel.app
- **Main Backend**: https://finanace-managment-app.onrender.com
- **Go MCP Server**: https://finanace-managment-app-1.onrender.com
- **Node MCP Proxy**: https://finanace-managment-app-2.onrender.com

## 🔧 Troubleshooting

If services still don't work:
1. Check deployment logs in Render/Vercel dashboards
2. Verify all environment variables are exactly as shown
3. Ensure no typos in URLs
4. Wait for services to fully restart (can take 2-3 minutes)
5. Test each service individually using the health endpoints
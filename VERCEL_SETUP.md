# Vercel Deployment Setup

## 🚀 Step-by-Step Vercel Deployment

### 1. Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository: `kartik1pandey/Finanace-managment-app`
4. Select the `Final` branch

### 2. Configure Build Settings

Vercel should auto-detect Next.js, but verify these settings:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

### 3. Set Environment Variables

In the Vercel deployment configuration, add these environment variables:

#### Required Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://nmoybswrkmbcolvqkjjt.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tb3lic3dya21iY29sdnFramp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDUxMTUsImV4cCI6MjA3ODcyMTExNX0.frXCjdayYtVQ4Tz35AO6EOfpx7WxU-7YqpABhBBba6w

NEXT_PUBLIC_BACKEND
Value: http://localhost:8000
(Update this after deploying backend to Railway)

NEXT_PUBLIC_MCP_SERVER
Value: http://localhost:5001  
(Update this after deploying MCP server to Railway)
```

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. You'll get a URL like: `https://your-project-name.vercel.app`

### 5. Update Backend URLs (After Backend Deployment)

Once you deploy your backend to Railway:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Update these variables:
   - `NEXT_PUBLIC_BACKEND` → `https://your-backend.railway.app`
   - `NEXT_PUBLIC_MCP_SERVER` → `https://your-mcp-server.railway.app`
4. Redeploy the project

## 🔧 Alternative: Manual Environment Variable Setup

If you prefer to set them manually in Vercel dashboard:

1. **After importing the project**, before clicking Deploy
2. **Expand "Environment Variables"** section
3. **Add each variable one by one**:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nmoybswrkmbcolvqkjjt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tb3lic3dya21iY29sdnFramp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDUxMTUsImV4cCI6MjA3ODcyMTExNX0.frXCjdayYtVQ4Tz35AO6EOfpx7WxU-7YqpABhBBba6w` |
| `NEXT_PUBLIC_BACKEND` | `http://localhost:8000` |
| `NEXT_PUBLIC_MCP_SERVER` | `http://localhost:5001` |

## 🧪 Testing Your Deployment

After deployment:

1. **Visit your Vercel URL**
2. **Check browser console** for any errors
3. **Test authentication** (sign up/login)
4. **Verify Supabase connection** works

## ⚠️ Common Issues & Solutions

### Issue 1: Build Fails
**Solution**: Check build logs in Vercel dashboard, usually missing dependencies

### Issue 2: Environment Variables Not Working
**Solution**: Make sure variable names are exactly as shown (case-sensitive)

### Issue 3: API Calls Fail
**Solution**: Backend URLs need to be updated after backend deployment

### Issue 4: Authentication Errors
**Solution**: Verify Supabase URL and key are correct

## 🔄 Updating After Backend Deployment

1. Deploy backend to Railway first
2. Get Railway URLs:
   - Backend: `https://your-backend-abc123.railway.app`
   - MCP Server: `https://your-mcp-server-def456.railway.app`
3. Update Vercel environment variables
4. Trigger a new deployment in Vercel

## 📱 Mobile Testing

Your Vercel deployment will work on mobile devices. Test:
- Responsive design
- Touch interactions
- Authentication flow
- Stock data loading

## 🎉 Success!

Once deployed successfully, you'll have:
- ✅ Frontend hosted on Vercel
- ✅ HTTPS enabled automatically
- ✅ Global CDN distribution
- ✅ Automatic deployments on git push
- ✅ Preview deployments for PRs

Your frontend will be accessible at: `https://your-project.vercel.app`
# Complete Guide: Deploy Backend to Render

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. **OpenAI API Key** - Get one from [platform.openai.com](https://platform.openai.com)

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Your Code is on GitHub

```bash
# If not already done, initialize git and push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 1.2 Verify Backend Structure

Make sure your backend folder structure looks like this:
```
datathon/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── api/
│   ├── utils/
│   └── .env.example
```

---

## Step 2: Create Render Account & Service

### 2.1 Sign Up / Log In to Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"** or **"Sign In"**
3. Sign up with GitHub (recommended) for easy repository connection

### 2.2 Create New Web Service

1. In Render dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Click **"Connect account"** if not already connected to GitHub
4. Select your repository: `YOUR_USERNAME/YOUR_REPO_NAME`

---

## Step 3: Configure Service Settings

### 3.1 Basic Settings

Fill in the following:

- **Name**: `bill-extraction-api` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` ⚠️ **IMPORTANT: Set this to `backend`**
- **Runtime**: `Docker` ⚠️ **IMPORTANT: Select Docker (not Node)**
- **Dockerfile Path**: `backend/Dockerfile` (or just `Dockerfile` if root directory is `backend`)
- **Build Command**: Leave empty (Docker handles this)
- **Start Command**: Leave empty (Docker handles this)

### 3.2 Build Command

**Option 1: Using Docker (Recommended)**

Leave Build Command **empty** - Render will use the Dockerfile automatically.

**Option 2: Without Docker**

If not using Docker, use:
```bash
npm install
```

⚠️ **Note**: Without Docker, PDF processing won't work. Use Docker for full functionality.

### 3.3 Start Command

```bash
npm start
```

---

## Step 4: Environment Variables

### 4.1 Add Environment Variables

In the Render dashboard, scroll down to **"Environment Variables"** section and click **"Add Environment Variable"**:

#### Required Variables:

1. **OPENAI_API_KEY**
   - Key: `OPENAI_API_KEY`
   - Value: `sk-your-actual-openai-api-key-here`
   - Click **"Save"**

2. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click **"Save"**

3. **PORT** (Optional - Render sets this automatically)
   - Key: `PORT`
   - Value: `10000` (or leave empty, Render will set it)

### 4.2 Verify Environment Variables

You should see:
```
OPENAI_API_KEY = sk-...
NODE_ENV = production
```

---

## Step 5: Advanced Settings (Optional)

### 5.1 Auto-Deploy

- ✅ **Auto-Deploy**: Enabled (deploys on every push to main branch)

### 5.2 Health Check Path

- **Health Check Path**: `/` (or `/health` if you have a health endpoint)

### 5.3 Instance Type

- **Free Tier**: 512 MB RAM (sufficient for testing)
- **Starter Plan**: 512 MB RAM ($7/month) - Better performance

---

## Step 6: Deploy

### 6.1 Start Deployment

1. Scroll to bottom of the page
2. Click **"Create Web Service"**
3. Render will start building your service

### 6.2 Monitor Build Logs

You'll see the build process:
```
==> Cloning from https://github.com/...
==> Building...
==> Installing system dependencies...
==> Installing npm packages...
==> Starting...
```

**Watch for:**
- ✅ `poppler-utils` installation success
- ✅ `npm install` completion
- ✅ Server starting on port

### 6.3 Build Time

- First deployment: ~5-10 minutes
- Subsequent deployments: ~3-5 minutes

---

## Step 7: Verify Deployment

### 7.1 Check Service Status

Once deployed, you should see:
- **Status**: ✅ Live
- **URL**: `https://your-service-name.onrender.com`

### 7.2 Test the Endpoint

1. Copy your service URL (e.g., `https://bill-extraction-api.onrender.com`)
2. Test health endpoint:
   ```bash
   curl https://your-service-name.onrender.com/
   ```
   Should return: `{"status":"ok","message":"Bill Extraction API is running"}`

3. Test main endpoint (using Postman or curl):
   ```bash
   curl -X POST https://your-service-name.onrender.com/extract-bill-data \
     -H "Content-Type: application/json" \
     -d '{"document": "https://example.com/bill.pdf"}'
   ```

---

## Step 8: Update Your Frontend (If Applicable)

If you have a frontend, update the backend URL:

### 8.1 Update Frontend Environment

In your frontend `.env.local` or environment variables:
```env
BACKEND_URL=https://your-service-name.onrender.com
```

### 8.2 Update API Route

In `frontend/pages/api/extract.ts`, it should already use:
```typescript
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
```

---

## Troubleshooting

### Issue 1: "linux is NOT supported" Error

**Solution**: Make sure your build command includes Poppler installation:
```bash
apt-get update && apt-get install -y poppler-utils && npm install
```

### Issue 2: Build Fails at npm install

**Possible causes:**
- Check that `Root Directory` is set to `backend`
- Verify `package.json` exists in backend folder
- Check build logs for specific error

### Issue 3: Service Crashes After Deployment

**Check:**
1. Environment variables are set correctly
2. `OPENAI_API_KEY` is valid
3. Check logs: Click on your service → "Logs" tab

### Issue 4: Port Error

**Solution**: Make sure `server.js` uses:
```javascript
const PORT = process.env.PORT || 3001;
```
Render sets `PORT` automatically.

### Issue 5: PDF Processing Fails

**Solution**: 
1. Verify Poppler is installed (check build logs)
2. Test with a simple PDF first
3. Check that file paths are correct

---

## Useful Render Features

### View Logs

1. Go to your service dashboard
2. Click **"Logs"** tab
3. See real-time logs and errors

### Manual Deploy

1. Go to **"Manual Deploy"** section
2. Click **"Deploy latest commit"**

### Environment Variables

- Edit anytime in **"Environment"** tab
- Changes require redeploy (automatic on free tier)

### Custom Domain

1. Go to **"Settings"** → **"Custom Domains"**
2. Add your domain
3. Follow DNS configuration instructions

---

## Cost Information

### Free Tier
- ✅ 750 hours/month free
- ✅ Auto-sleeps after 15 minutes of inactivity
- ✅ Wakes up on first request (may take 30-60 seconds)

### Paid Plans
- **Starter**: $7/month - Always on, faster cold starts
- **Standard**: $25/month - More resources, better performance

---

## Quick Reference Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service created
- [ ] Root directory set to `backend`
- [ ] Build command: `apt-get update && apt-get install -y poppler-utils && npm install`
- [ ] Start command: `npm start`
- [ ] `OPENAI_API_KEY` environment variable set
- [ ] `NODE_ENV=production` set
- [ ] Service deployed successfully
- [ ] Health endpoint tested
- [ ] Main API endpoint tested

---

## Next Steps

1. **Monitor Performance**: Check logs regularly
2. **Set Up Alerts**: Configure email notifications for crashes
3. **Scale if Needed**: Upgrade plan if you get more traffic
4. **Add Custom Domain**: Use your own domain name
5. **Set Up CI/CD**: Automate testing before deployment

---

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Your Service Logs**: Check in Render dashboard for specific errors

---

## Example Successful Deployment

```
✅ Service Status: Live
✅ URL: https://bill-extraction-api.onrender.com
✅ Health Check: Passing
✅ Build Time: 4m 32s
✅ Last Deploy: 2 minutes ago
```

Your backend is now live and ready to accept requests! 🚀


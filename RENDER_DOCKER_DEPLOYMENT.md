# Deploy Backend to Render Using Docker

## Why Docker?

Render's build environment doesn't allow `apt-get` commands (read-only filesystem). Docker allows us to install system dependencies like Poppler.

---

## Step-by-Step Guide

### Step 1: Verify Dockerfile Exists

Make sure `backend/Dockerfile` exists in your repository. It should contain:

```dockerfile
FROM node:22-slim
RUN apt-get update && apt-get install -y poppler-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 10000
CMD ["npm", "start"]
```

### Step 2: Create Render Service

1. Go to [render.com](https://render.com) dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

### Step 3: Configure Service

**Important Settings:**

- **Name**: `bill-extraction-api`
- **Region**: Choose your preferred region
- **Branch**: `main` (or your branch)
- **Root Directory**: `backend` ⚠️ **CRITICAL**
- **Runtime**: **Docker** ⚠️ **Select Docker, not Node**
- **Dockerfile Path**: `Dockerfile` (since root directory is `backend`)
- **Build Command**: Leave **empty**
- **Start Command**: Leave **empty**

### Step 4: Environment Variables

Add these environment variables:

```
OPENAI_API_KEY = sk-your-key-here
NODE_ENV = production
PORT = 10000
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (~5-10 minutes first time)
3. Your service will be live at: `https://your-service-name.onrender.com`

---

## Alternative: If Docker Doesn't Work

If you can't use Docker, you have two options:

### Option A: Use External PDF Service

Modify the code to use an external PDF-to-image service (like CloudConvert API, etc.)

### Option B: Accept Image-Only Support

Modify the code to only accept image files (PNG, JPG) and skip PDF processing.

---

## Troubleshooting

### Issue: "Docker build failed"

**Check:**
1. Dockerfile exists in `backend/` directory
2. Root Directory is set to `backend`
3. Dockerfile path is correct

### Issue: "Cannot find Dockerfile"

**Solution:**
- Verify `backend/Dockerfile` exists
- Check Root Directory is `backend`
- Try Dockerfile Path: `./Dockerfile` or just `Dockerfile`

### Issue: "Port binding error"

**Solution:**
- Make sure server.js uses: `const PORT = process.env.PORT || 10000;`
- Render sets PORT automatically, but default to 10000

---

## Quick Checklist

- [ ] `backend/Dockerfile` exists
- [ ] Root Directory = `backend`
- [ ] Runtime = `Docker` (not Node)
- [ ] Dockerfile Path = `Dockerfile`
- [ ] Build Command = empty
- [ ] Start Command = empty
- [ ] Environment variables set
- [ ] Service deployed successfully

---

## What Docker Does

The Dockerfile:
1. Uses Node.js 22 slim image
2. Installs Poppler utilities (for PDF processing)
3. Installs npm dependencies
4. Copies your code
5. Exposes port 10000
6. Starts your application

This way, Poppler is available inside the container, even though Render's build environment doesn't allow `apt-get`.


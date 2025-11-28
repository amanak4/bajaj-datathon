# Fix: "invalid local: resolve" Error on Render

## Problem
Error: `invalid local: resolve : lstat /opt/render/project/src/backend/backend: no such file or directory`

This happens when Root Directory and Dockerfile path conflict.

## Solution: Two Options

### Option 1: Use Root Directory = Empty (Recommended)

**In Render Dashboard:**

1. **Root Directory**: Leave **EMPTY** (don't set to `backend`)
2. **Runtime**: `Docker`
3. **Dockerfile Path**: `Dockerfile` (the root-level Dockerfile I just created)
4. **Build Command**: Leave empty
5. **Start Command**: Leave empty

The root-level `Dockerfile` will handle copying from `backend/` directory.

### Option 2: Use Root Directory = backend

**In Render Dashboard:**

1. **Root Directory**: `backend`
2. **Runtime**: `Docker`
3. **Dockerfile Path**: `Dockerfile` (not `backend/Dockerfile`)
4. **Build Command**: Leave empty
5. **Start Command**: Leave empty

Use the `backend/Dockerfile` (which I already created).

---

## Recommended: Option 1

I've created a root-level `Dockerfile` that:
- Copies from `backend/package.json`
- Copies all `backend/` files
- Works when Root Directory is empty

**Settings:**
```
Root Directory: (empty)
Runtime: Docker
Dockerfile Path: Dockerfile
```

---

## Quick Fix Steps

1. **Delete the current service** (or update settings)
2. **Create new service** with:
   - Root Directory: **EMPTY**
   - Runtime: **Docker**
   - Dockerfile Path: **Dockerfile**
3. **Add environment variables**:
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`
4. **Deploy**

---

## Verify Dockerfile Location

Make sure you have:
- ✅ `Dockerfile` at root (for Option 1)
- ✅ `backend/Dockerfile` (for Option 2)

Both exist, so choose one approach and stick with it.


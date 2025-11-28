# Deployment Guide for Render

## Issue
The error "linux is NOT supported" occurs because `pdf-poppler` requires Poppler to be installed on the system.

## Solution

### For Render Deployment

1. **In Render Dashboard**, go to your service settings
2. **Add Build Command**:
   ```bash
   apt-get update && apt-get install -y poppler-utils && npm install
   ```

   Or if you have a separate build script:
   ```bash
   chmod +x backend/render-build.sh && ./backend/render-build.sh
   ```

3. **Start Command** should be:
   ```bash
   cd backend && npm start
   ```

### Alternative: Using render.yaml

If you're using `render.yaml`, the build command is already configured:

```yaml
buildCommand: npm install && apt-get update && apt-get install -y poppler-utils
```

### Environment Variables

Make sure to set in Render:
- `OPENAI_API_KEY` - Your OpenAI API key
- `PORT` - Usually set automatically by Render (use `process.env.PORT` in code)
- `NODE_ENV` - Set to `production`

### Verify Poppler Installation

After deployment, you can verify Poppler is installed by checking the build logs. You should see:
```
Setting up poppler-utils...
```

### Troubleshooting

If you still get "linux is NOT supported":
1. Check that the build command includes Poppler installation
2. Ensure the build command runs before `npm install`
3. Try using the full path: `/usr/bin/pdftoppm` in your code (not recommended)

### Alternative Solutions

If Poppler installation continues to cause issues, consider:
1. Using a Docker container with Poppler pre-installed
2. Using a different PDF processing service
3. Using a pure JavaScript PDF library (may have limitations)


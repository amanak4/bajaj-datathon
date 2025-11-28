# Setup Instructions

## Step 1: Install System Dependencies

### Poppler (Required for PDF processing)

**Windows:**
1. **Download Poppler:**
   - Go to: https://github.com/oschwartz10612/poppler-windows/releases
   - Click on the latest release (e.g., "Release 25.11.0-0")
   - Download the `Release-25.11.0-0.zip` file (or the latest version available)

2. **Extract the ZIP file:**
   - Right-click the downloaded ZIP file and select "Extract All..."
   - Choose a location (e.g., `C:\poppler` or `C:\Program Files\poppler`)
   - Extract the files

3. **Add to PATH (Windows 10/11):**
   - Press `Windows Key + X` and select "System"
   - Click "Advanced system settings" on the right
   - Click "Environment Variables" button
   - Under "System variables", find and select "Path", then click "Edit"
   - Click "New" and add the path to the `bin` folder inside the extracted poppler folder
     - **Finding the bin folder:** After extracting, look inside the folder structure. The `bin` folder is usually located at:
       - `Release-XX.XX.X-X\Library\bin` (most common)
       - Or sometimes: `Release-XX.XX.X-X\bin`
     - Example paths:
       - `C:\poppler\Release-25.11.0-0\Library\bin`
       - `C:\Program Files\poppler\Release-25.11.0-0\Library\bin`
     - **Tip:** You can copy the full path by navigating to the `bin` folder in File Explorer, clicking the address bar, and copying the path
   - Click "OK" on all dialogs
   - **Important:** Close and reopen your terminal/command prompt for changes to take effect

4. **Verify installation:**
   - Open a new terminal/command prompt (Git Bash, PowerShell, or CMD)
   - Type: `pdftoppm -h`
   - If you see help text (not "command not found"), Poppler is installed correctly!

**macOS:**
```bash
brew install poppler
```

**Linux:**
```bash
sudo apt-get install poppler-utils
# or for Fedora/CentOS
sudo yum install poppler-utils
```

## Step 2: Install Node.js Dependencies

From the project root:
```bash
npm run install:all
```

This will install dependencies for:
- Root package.json
- Backend package.json
- Frontend package.json

## Step 3: Configure Environment

1. Copy the example env file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Step 4: Run the Application

### Development Mode (Both servers)
```bash
npm run dev
```

### Or run separately:

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

## Step 5: Test the System

1. Open http://localhost:3000 in your browser
2. Enter a document URL (PDF or image)
3. Click "Extract Bill"
4. View the extracted line items

## Troubleshooting

### PDF conversion fails / Poppler not found

**Windows PATH Issues:**
- If `pdftoppm -h` says "command not found":
  1. Double-check the PATH was added correctly:
     - Open System Properties → Environment Variables
     - Verify the `bin` folder path is in the Path variable
  2. Make sure you closed and reopened your terminal after adding to PATH
  3. Try using the full path directly to test:
     - Example: `C:\poppler\Release-25.11.0-0\Library\bin\pdftoppm.exe -h`
  4. If using Git Bash, you may need to restart it completely
  5. Verify the `bin` folder contains `pdftoppm.exe` and other `.exe` files

**General:**
- Ensure Poppler is installed and in PATH
- Check: `pdftoppm -h` works in terminal
- On Windows, the command might be `pdftoppm.exe -h` in some terminals

### OCR accuracy is low
- Ensure images are clear and high resolution
- The preprocessing pipeline should help, but quality input matters

### OpenAI API errors
- Verify your API key is correct
- Check you have credits/quota available
- Ensure network connectivity

### Port already in use
- Change PORT in backend/.env
- Update FRONTEND_URL if needed


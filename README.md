# Bill Extraction AI System

AI-powered system for extracting line items from PDF/scanned image bills.

## Features

- 📄 PDF and image support
- 🔍 Advanced OCR with preprocessing
- 🤖 LLM-powered extraction via LangChain
- 📊 Page-wise line item extraction
- ✅ Automatic reconciliation and validation
- 🛡️ Fraud detection capabilities
- ⚡ Optimized for low latency

## Prerequisites

- Node.js (v18 or higher)
- Poppler (for PDF processing)
  - Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases
  - macOS: `brew install poppler`
  - Linux: `sudo apt-get install poppler-utils`

## Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Add your OPENAI_API_KEY
```

3. Run development servers:
```bash
npm run dev
```

The backend will run on `http://localhost:3001` and frontend on `http://localhost:3000`

## API Endpoint

POST `/api/extract-bill`

Request:
```json
{
  "document": "DOCUMENT_URL"
}
```

Response:
```json
{
  "is_success": true,
  "data": {
    "pagewise_line_items": [...],
    "total_item_count": 12,
    "reconciled_amount": 16390.00
  }
}
```


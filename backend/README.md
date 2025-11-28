# Backend Setup

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Poppler** (for PDF processing)
   - Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases
   - macOS: `brew install poppler`
   - Linux: `sudo apt-get install poppler-utils`

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Running

```bash
npm start
# or for development
npm run dev
```

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


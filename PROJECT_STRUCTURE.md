# Project Structure

```
datathon/
├── backend/                    # Node.js Backend API
│   ├── api/
│   │   └── extractBill.js     # Main extraction logic
│   ├── utils/
│   │   ├── fileHandler.js      # PDF/image download & processing
│   │   ├── imagePreprocessor.js # Image preprocessing pipeline
│   │   ├── ocr.js              # Tesseract OCR integration
│   │   ├── langchainExtractor.js # LLM extraction via LangChain
│   │   ├── reconciliation.js   # Amount validation & reconciliation
│   │   ├── fraudDetection.js   # Fraud detection module
│   │   └── schema.js           # Zod validation schemas
│   ├── server.js               # Express server
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                   # Next.js Frontend
│   ├── pages/
│   │   ├── index.tsx           # Main upload & display page
│   │   ├── _app.tsx            # App wrapper
│   │   └── api/
│   │       └── extract.ts      # API proxy to backend
│   ├── styles/
│   │   └── globals.css         # Global styles
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── package.json                # Root package.json
├── README.md                   # Main documentation
├── SETUP.md                    # Setup instructions
├── API_USAGE.md                # API usage examples
└── .gitignore
```

## Architecture Flow

```
User Upload (Frontend)
    ↓
Next.js API Route (/api/extract)
    ↓
Backend API (/api/extract-bill)
    ↓
1. Download Document (fileHandler.js)
    ↓
2. Detect Type (PDF/Image)
    ↓
3. Convert PDF → Images (if needed)
    ↓
4. Preprocess Images (imagePreprocessor.js)
    - Grayscale
    - Thresholding
    - Deskewing
    - Sharpening
    ↓
5. OCR Extraction (ocr.js)
    - Tesseract.js
    ↓
6. LLM Extraction (langchainExtractor.js)
    - LangChain + OpenAI
    - Structured output parsing
    ↓
7. Reconciliation (reconciliation.js)
    - Amount validation
    - Duplicate removal
    - Total calculation
    ↓
8. Fraud Detection (fraudDetection.js)
    - Optional flags
    ↓
9. Return JSON Response
```

## Key Features

### Backend Modules

1. **fileHandler.js**: Handles document download, type detection, and PDF-to-image conversion
2. **imagePreprocessor.js**: Advanced image preprocessing for better OCR accuracy
3. **ocr.js**: Tesseract.js integration for text extraction
4. **langchainExtractor.js**: LLM-powered structured extraction using LangChain
5. **reconciliation.js**: Validates amounts, removes duplicates, calculates totals
6. **fraudDetection.js**: Detects potential fraud indicators
7. **schema.js**: Zod schemas for validation

### Frontend Components

1. **index.tsx**: Main UI with upload form and results display
2. **api/extract.ts**: Proxies requests to backend API

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js, Express
- **OCR**: Tesseract.js
- **LLM**: OpenAI (via LangChain)
- **PDF Processing**: pdf-poppler (requires Poppler)
- **Image Processing**: Sharp
- **Validation**: Zod
- **HTTP Client**: Axios


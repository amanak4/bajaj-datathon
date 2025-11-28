# API Usage Guide

## Endpoint

**POST** `/api/extract-bill`

## Request Format

```json
{
  "document": "DOCUMENT_URL"
}
```

The `document` field should be a publicly accessible URL to:
- A PDF file (`.pdf`)
- An image file (`.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`)

## Response Format

### Success Response

```json
{
  "is_success": true,
  "data": {
    "pagewise_line_items": [
      {
        "page_no": "1",
        "bill_items": [
          {
            "item_name": "Consultation (Dr. Neo Church Tharsis(Diabetologist, General Medicine))",
            "item_amount": 4000.00,
            "item_rate": 1000.00,
            "item_quantity": 4.00
          },
          {
            "item_name": "RENAL FUNCTION TEST (RFT)",
            "item_amount": 240.00,
            "item_rate": 240.00,
            "item_quantity": 1.00
          }
        ]
      }
    ],
    "total_item_count": 12,
    "reconciled_amount": 16390.00,
    "fraud_flags": ["font_inconsistency"] // Optional, only if fraud detected
  }
}
```

### Error Response

```json
{
  "is_success": false,
  "error": "Error message here"
}
```

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:3001/api/extract-bill \
  -H "Content-Type: application/json" \
  -d '{"document": "https://example.com/bill.pdf"}'
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

async function extractBill(documentUrl) {
  try {
    const response = await axios.post('http://localhost:3001/api/extract-bill', {
      document: documentUrl
    });
    
    console.log('Extraction successful!');
    console.log(`Total items: ${response.data.data.total_item_count}`);
    console.log(`Total amount: ₹${response.data.data.reconciled_amount}`);
    
    return response.data;
  } catch (error) {
    console.error('Extraction failed:', error.response?.data || error.message);
  }
}

// Usage
extractBill('https://example.com/bill.pdf');
```

### Using Python

```python
import requests

def extract_bill(document_url):
    url = "http://localhost:3001/api/extract-bill"
    payload = {"document": document_url}
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("is_success"):
            print(f"Total items: {data['data']['total_item_count']}")
            print(f"Total amount: ₹{data['data']['reconciled_amount']}")
            return data
        else:
            print(f"Error: {data.get('error')}")
    else:
        print(f"HTTP Error: {response.status_code}")

# Usage
extract_bill("https://example.com/bill.pdf")
```

## Response Fields

### `pagewise_line_items`
Array of objects, one per page, containing:
- `page_no`: Page number as string
- `bill_items`: Array of extracted line items

### `bill_items` (each item)
- `item_name`: Name/description of the service/item
- `item_rate`: Rate per unit
- `item_quantity`: Quantity (defaults to 1.0 if not specified)
- `item_amount`: Total amount (rate × quantity)

### `total_item_count`
Total number of unique line items across all pages

### `reconciled_amount`
Sum of all `item_amount` values, validated and deduplicated

### `fraud_flags` (optional)
Array of detected fraud indicators:
- `font_inconsistency`: Low OCR confidence detected
- `duplicate_items`: Same item with different amounts
- `total_mismatch`: Calculated total doesn't match extracted total

## Notes

1. **Processing Time**: Typically 3-10 seconds depending on document size and complexity
2. **Rate Limits**: Be mindful of OpenAI API rate limits for high-volume usage
3. **File Size**: Large PDFs may take longer to process
4. **Image Quality**: Higher quality images result in better OCR accuracy


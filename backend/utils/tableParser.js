/**
 * Utility to parse structured tables from OCR text (esp. Qty/Rate/Amount columns)
 */

function parseNumber(value) {
  if (typeof value !== 'string') return NaN;
  const sanitized = value.replace(/[^0-9.-]/g, '');
  if (!sanitized) return NaN;
  return parseFloat(sanitized);
}

/**
 * Parse table rows with date pattern (Sl# Description Date Qty Rate Amount)
 */
function parseWithDatePattern(lines) {
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
  const parsedItems = [];

  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    const dateToken = dateMatch[0];
    const dateIndex = line.indexOf(dateToken);
    if (dateIndex === -1) continue;

    const beforeDate = line.slice(0, dateIndex).trim();
    const afterDate = line.slice(dateIndex + dateToken.length).trim();

    const slMatch = beforeDate.match(/^\d+/);
    if (!slMatch) continue;

    const descriptionPart = beforeDate.slice(slMatch[0].length).trim();
    if (!descriptionPart) continue;

    const numericParts = afterDate.split(/\s+/).filter(Boolean);
    if (numericParts.length < 3) continue;

    const quantity = parseNumber(numericParts[0]);
    const rate = parseNumber(numericParts[1]);
    const amount = parseNumber(numericParts[2]);

    if ([quantity, rate, amount].some(num => Number.isNaN(num))) continue;

    parsedItems.push({
      item_name: descriptionPart.replace(/\s{2,}/g, ' ').trim(),
      item_rate: Number(Number(rate).toFixed(2)),
      item_quantity: Number(Number(quantity).toFixed(2)),
      item_amount: Number(Number(amount).toFixed(2))
    });
  }

  return parsedItems;
}

/**
 * Parse table rows with Qty/Rate/Net Amt pattern (Description Qty/Hrs Rate Discount Net Amt)
 */
function parseWithQtyRateNetPattern(lines) {
  const parsedItems = [];
  
  // Skip header lines
  const headerKeywords = ['description', 'qty', 'rate', 'discount', 'net', 'amt', 'hrs'];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip header rows
    if (headerKeywords.some(keyword => lowerLine.includes(keyword) && lowerLine.split(/\s+/).length < 5)) {
      continue;
    }
    
    // Skip category/subtotal lines
    if (/total|subtotal|category|charges?\s*$/i.test(line.trim())) {
      continue;
    }
    
    // Look for pattern: Description followed by numbers (Qty Rate Discount Net Amt)
    // Extract all numbers from the line
    const numbers = line.match(/\d+\.?\d*/g) || [];
    
    if (numbers.length < 3) continue;
    
    // Try to find description (text before first significant number)
    // Look for pattern where we have: text, then quantity, rate, discount, amount
    const parts = line.trim().split(/\s+/);
    
    // Find where numbers start
    let numberStartIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      if (/^\d+\.?\d*$/.test(parts[i])) {
        numberStartIndex = i;
        break;
      }
    }
    
    if (numberStartIndex === -1 || numberStartIndex < 1) continue;
    
    // Description is everything before the numbers
    const descriptionParts = parts.slice(0, numberStartIndex);
    const description = descriptionParts.join(' ').trim();
    
    if (!description || description.length < 2) continue;
    
    // Extract numeric values (usually: Qty, Rate, Discount, Net Amt)
    const numericValues = parts.slice(numberStartIndex).filter(p => /^\d+\.?\d*$/.test(p));
    
    if (numericValues.length < 3) continue;
    
    // Common patterns:
    // Pattern 1: Qty Rate Discount NetAmt (4 numbers)
    // Pattern 2: Qty Rate NetAmt (3 numbers, discount might be 0 or missing)
    
    let quantity, rate, amount;
    
    if (numericValues.length >= 4) {
      // Qty Rate Discount NetAmt
      quantity = parseNumber(numericValues[0]);
      rate = parseNumber(numericValues[1]);
      amount = parseNumber(numericValues[3]); // Net Amt is usually last
    } else if (numericValues.length === 3) {
      // Qty Rate NetAmt (discount is 0 or missing)
      quantity = parseNumber(numericValues[0]);
      rate = parseNumber(numericValues[1]);
      amount = parseNumber(numericValues[2]);
    } else {
      continue;
    }
    
    if ([quantity, rate, amount].some(num => Number.isNaN(num) || num <= 0)) continue;
    
    parsedItems.push({
      item_name: description.replace(/\s{2,}/g, ' ').trim(),
      item_rate: Number(Number(rate).toFixed(2)),
      item_quantity: Number(Number(quantity).toFixed(2)),
      item_amount: Number(Number(amount).toFixed(2))
    });
  }
  
  return parsedItems;
}

/**
 * Attempt to parse rows from structured tables
 * Tries multiple patterns to handle different bill formats
 */
export function parseTableRows(ocrText = '') {
  if (!ocrText) return [];

  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Try date-based pattern first
  const datePatternItems = parseWithDatePattern(lines);
  if (datePatternItems.length > 0) {
    return datePatternItems;
  }
  
  // Try Qty/Rate/Net Amt pattern
  const qtyRatePatternItems = parseWithQtyRateNetPattern(lines);
  if (qtyRatePatternItems.length > 0) {
    return qtyRatePatternItems;
  }
  
  return [];
}


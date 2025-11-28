/**
 * Detect page type from OCR text
 */
export function detectPageType(ocrText) {
  if (!ocrText) return 'Bill Detail';

  const text = ocrText.toLowerCase();

  // Check for Final Bill indicators
  if (
    text.includes('final bill') ||
    text.includes('total amount') ||
    text.includes('grand total') ||
    text.includes('final total') ||
    (text.includes('total') && text.includes('payable'))
  ) {
    return 'Final Bill';
  }

  // Check for Pharmacy indicators
  if (
    text.includes('pharmacy') ||
    text.includes('medicine') ||
    text.includes('prescription') ||
    text.includes('drug') ||
    /tablet|syrup|capsule|injection/i.test(text)
  ) {
    return 'Pharmacy';
  }

  // Default to Bill Detail
  return 'Bill Detail';
}


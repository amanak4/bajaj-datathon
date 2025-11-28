/**
 * Fraud detection module
 */

/**
 * Detect font inconsistencies (based on OCR confidence)
 */
export function detectFontInconsistency(ocrResults) {
  const fraudFlags = [];
  
  // Check if any page has unusually low confidence
  const lowConfidencePages = ocrResults.filter(page => page.confidence < 60);
  
  if (lowConfidencePages.length > 0) {
    fraudFlags.push('font_inconsistency');
  }
  
  return fraudFlags;
}

/**
 * Detect duplicate items across pages
 */
export function detectDuplicateItems(pagewiseLineItems) {
  const fraudFlags = [];
  const itemMap = new Map();
  
  pagewiseLineItems.forEach(page => {
    page.bill_items.forEach(item => {
      const key = item.item_name.toLowerCase().trim();
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        // Check if same item appears with different amounts
        if (Math.abs(existing.item_amount - item.item_amount) > 0.01) {
          fraudFlags.push('duplicate_items');
        }
      } else {
        itemMap.set(key, item);
      }
    });
  });
  
  return fraudFlags;
}

/**
 * Detect total mismatch
 */
export function detectTotalMismatch(reconciledAmount, extractedTotal) {
  const fraudFlags = [];
  
  if (extractedTotal && Math.abs(reconciledAmount - extractedTotal) > 1.0) {
    fraudFlags.push('total_mismatch');
  }
  
  return fraudFlags;
}

/**
 * Run all fraud detection checks
 */
export function detectFraud(pagewiseLineItems, ocrResults, reconciledAmount, extractedTotal) {
  const fraudFlags = [];
  
  // Font inconsistency check
  const fontFlags = detectFontInconsistency(ocrResults);
  fraudFlags.push(...fontFlags);
  
  // Duplicate items check
  const duplicateFlags = detectDuplicateItems(pagewiseLineItems);
  fraudFlags.push(...duplicateFlags);
  
  // Total mismatch check
  const totalFlags = detectTotalMismatch(reconciledAmount, extractedTotal);
  fraudFlags.push(...totalFlags);
  
  // Remove duplicates from flags array
  return [...new Set(fraudFlags)];
}


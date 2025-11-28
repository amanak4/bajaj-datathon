/**
 * Reconciliation engine to ensure accuracy
 */

/**
 * Validate item amounts (rate × quantity = amount)
 */
export function validateItemAmounts(billItems) {
  const validatedItems = billItems.map(item => {
    const calculatedAmount = item.item_rate * item.item_quantity;
    const roundedAmount = Math.round(calculatedAmount * 100) / 100;
    
    // Format all numeric values to 2 decimal places
    const formattedItem = {
      item_name: item.item_name,
      item_rate: Number(Number(item.item_rate).toFixed(2)),
      item_quantity: Number(Number(item.item_quantity).toFixed(2)),
      item_amount: Number(Number(roundedAmount).toFixed(2))
    };
    
    // If there's a mismatch, use calculated amount
    if (Math.abs(item.item_amount - roundedAmount) > 0.01) {
      console.warn(`Amount mismatch for ${item.item_name}: expected ${roundedAmount}, got ${item.item_amount}`);
    }
    
    return formattedItem;
  });

  return validatedItems;
}

/**
 * Remove duplicate items based on item name and amount
 */
export function removeDuplicates(billItems) {
  const seen = new Set();
  const uniqueItems = [];

  for (const item of billItems) {
    // Create a unique key based on name and amount
    const key = `${item.item_name.toLowerCase().trim()}_${item.item_amount}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    } else {
      console.warn(`Duplicate item detected and removed: ${item.item_name}`);
    }
  }

  return uniqueItems;
}

/**
 * Reconcile total amount
 */
export function reconcileAmount(billItems) {
  // Validate amounts first
  const validatedItems = validateItemAmounts(billItems);
  
  // Remove duplicates
  const uniqueItems = removeDuplicates(validatedItems);
  
  // Calculate total
  const total = uniqueItems.reduce((sum, item) => {
    return sum + item.item_amount;
  }, 0);

  return {
    items: uniqueItems,
    total: Math.round(total * 100) / 100,
    itemCount: uniqueItems.length
  };
}

/**
 * Reconcile all pages and compute final totals
 */
export function reconcileAllPages(pagewiseLineItems) {
  // Collect all items from all pages
  const allItems = [];
  
  pagewiseLineItems.forEach(page => {
    if (page.bill_items && Array.isArray(page.bill_items)) {
      allItems.push(...page.bill_items);
    }
  });

  // Reconcile
  const reconciled = reconcileAmount(allItems);

  // Rebuild pagewise structure with validated items
  const reconciledPages = pagewiseLineItems.map(page => {
    // For now, keep page items as-is but validated
    // In a more sophisticated system, you might track which items belong to which page
    const pageItems = page.bill_items || [];
    const validatedPageItems = validateItemAmounts(pageItems);
    
    return {
      page_no: page.page_no,
      page_type: page.page_type || 'Bill Detail', // Preserve page_type
      bill_items: validatedPageItems
    };
  });

  return {
    pagewise_line_items: reconciledPages,
    total_item_count: reconciled.itemCount,
    reconciled_amount: reconciled.total
  };
}


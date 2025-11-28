import { z } from 'zod';

/**
 * Zod schema for bill item validation
 */
export const BillItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  item_rate: z.number().positive("Item rate must be positive"),
  item_quantity: z.number().positive("Item quantity must be positive"),
  item_amount: z.number().nonnegative("Item amount must be non-negative")
});

/**
 * Zod schema for page-wise line items
 */
export const PageLineItemsSchema = z.object({
  page_no: z.string(),
  bill_items: z.array(BillItemSchema)
});

/**
 * Zod schema for final output
 */
export const ExtractionResultSchema = z.object({
  is_success: z.boolean(),
  data: z.object({
    pagewise_line_items: z.array(PageLineItemsSchema),
    total_item_count: z.number().int().nonnegative(),
    reconciled_amount: z.number().nonnegative()
  })
});

/**
 * Validate bill item
 */
export function validateBillItem(item) {
  try {
    return BillItemSchema.parse(item);
  } catch (error) {
    throw new Error(`Invalid bill item: ${error.message}`);
  }
}

/**
 * Validate extraction result
 */
export function validateExtractionResult(result) {
  try {
    return ExtractionResultSchema.parse(result);
  } catch (error) {
    throw new Error(`Invalid extraction result: ${error.message}`);
  }
}


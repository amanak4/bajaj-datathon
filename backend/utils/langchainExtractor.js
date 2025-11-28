import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { BillItemSchema } from "./schema.js";
import { parseTableRows } from "./tableParser.js";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

/**
 * Extract bill items from OCR text using LangChain and LLM
 * Returns both items and token usage
 */
export async function extractBillItemsFromText(ocrText, pageNumber, tokenTracker = null) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    // First try deterministic parsing for well-structured tables
    // This doesn't use LLM, so no tokens are consumed
    const parsedTableItems = parseTableRows(ocrText);
    if (parsedTableItems.length > 0) {
      console.log(`Using tableParser for page ${pageNumber} - found ${parsedTableItems.length} items, no LLM tokens used`);
      return { bill_items: parsedTableItems, tokenUsage: null };
    }
    
    // Log when tableParser fails so we know LLM will be used
    console.log(`TableParser found 0 items for page ${pageNumber}, falling back to LLM extraction`);

    // Define the output schema
    const outputSchema = z.object({
      bill_items: z.array(BillItemSchema).describe("Array of bill line items extracted from the text")
    });

    // Create structured output parser
    const parser = StructuredOutputParser.fromZodSchema(outputSchema);

    // Create prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert at extracting medical bill line items from OCR text.

Extract ALL line items from the following bill text. For each item, identify:
- item_name: The name/description of the service or item
- item_rate: The rate/price per unit
- item_quantity: The quantity (default to 1.0 if not specified)
- item_amount: The total amount for this line item (prefer Net Amt/Gross Amount if shown, otherwise rate × quantity)

Important rules:
1. Extract EVERY line item, including consultations, tests, procedures, charges, medicines, etc.
2. If quantity is not mentioned, assume 1.0
3. Prefer the actual "Net Amt" or "Gross Amount" column value for item_amount over calculated values
4. If Net Amt/Gross Amount is not available, calculate item_amount = item_rate × item_quantity
5. Do NOT include totals, subtotals, category headers, or summary lines
6. Do NOT duplicate items
7. Preserve exact item names as they appear in the bill
8. When the text shows tabular columns like "Qty/Hrs | Rate | Discount | Net Amt", extract ALL columns correctly
9. Never default to quantity 1.0 if a numeric quantity column exists in the row
10. All numeric outputs must include decimals (e.g., 14.00, 32.00)
11. Look for patterns like: Description followed by Qty, Rate, and Amount columns
12. Even if OCR text is messy or has errors, try to extract all visible line items

OCR Text from Page {pageNumber}:
{ocrText}

{format_instructions}
`);

    // Create callback handler to track token usage
    let capturedTokenUsage = null;
    
    class TokenUsageCallback extends BaseCallbackHandler {
      name = "TokenUsageCallback";
      
      async handleLLMEnd(output) {
        try {
          // Token usage is in llmOutput
          if (output.llmOutput?.tokenUsage) {
            capturedTokenUsage = output.llmOutput.tokenUsage;
            if (tokenTracker) {
              tokenTracker.addUsage(capturedTokenUsage);
            }
          } else if (output.llmOutput?.usage) {
            capturedTokenUsage = output.llmOutput.usage;
            if (tokenTracker) {
              tokenTracker.addUsage(capturedTokenUsage);
            }
          }
        } catch (err) {
          console.warn('Token callback error:', err);
        }
      }
    }

    const callbackManager = CallbackManager.fromHandlers([new TokenUsageCallback()]);

    // Initialize LLM with callback
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini", // Using mini for faster/cheaper processing
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
      callbacks: callbackManager
    });

    // Create chain
    const chain = promptTemplate.pipe(model).pipe(parser);

    // Extract items with callback tracking
    const response = await chain.invoke({
      ocrText: ocrText,
      pageNumber: pageNumber,
      format_instructions: parser.getFormatInstructions()
    }, {
      callbacks: callbackManager
    });

    // Also try to get token usage from response metadata (fallback)
    let tokenUsage = capturedTokenUsage;
    if (!tokenUsage) {
      try {
        // LangChain returns token usage in different places depending on version
        if (response?.response_metadata?.token_usage) {
          tokenUsage = response.response_metadata.token_usage;
          if (tokenTracker) {
            tokenTracker.addUsage(tokenUsage);
          }
        } else if (response?.usage) {
          tokenUsage = response.usage;
          if (tokenTracker) {
            tokenTracker.addUsage(tokenUsage);
          }
        }
      } catch (err) {
        console.warn('Token tracking error:', err);
      }
    }
    
    if (!tokenUsage) {
      console.log(`⚠️ No token usage captured for page ${pageNumber} - check LLM response structure`);
    }

    // Get the actual result - handle different response structures
    let result = response;
    
    // Check if response has bill_items directly
    if (response.bill_items) {
      result = response;
    } else if (response.output && response.output.bill_items) {
      result = response.output;
    } else if (typeof response === 'object' && 'bill_items' in response) {
      result = response;
    } else {
      // Try to extract from nested structure
      console.warn(`Unexpected response structure for page ${pageNumber}:`, Object.keys(response));
      result = { bill_items: [] };
    }

    // Validate and return
    if (!result.bill_items || !Array.isArray(result.bill_items)) {
      console.warn(`No bill_items found in LLM response for page ${pageNumber}`);
      return { bill_items: [], tokenUsage };
    }
    
    console.log(`LLM extracted ${result.bill_items.length} items for page ${pageNumber}`);

    // Validate each item and format numbers
    const validatedItems = result.bill_items.map(item => {
      // Ensure item_amount matches rate × quantity
      const calculatedAmount = item.item_rate * item.item_quantity;
      return {
        item_name: item.item_name,
        item_rate: Number(Number(item.item_rate).toFixed(2)),
        item_quantity: Number(Number(item.item_quantity).toFixed(2)),
        item_amount: Number(Number(calculatedAmount).toFixed(2))
      };
    });

    return { bill_items: validatedItems, tokenUsage };
  } catch (error) {
    console.error(`LLM extraction error for page ${pageNumber}:`, error);
    // Return empty array on error rather than failing completely
    return { bill_items: [], tokenUsage: null };
  }
}

/**
 * Extract bill items from multiple pages
 * Returns results with token tracking
 */
export async function extractBillItemsFromPages(pageTexts, tokenTracker = null) {
  try {
    // Process pages sequentially to avoid rate limits
    // Can be parallelized with proper rate limiting
    const extractionPromises = pageTexts.map(page => 
      extractBillItemsFromText(page.text, page.pageNumber, tokenTracker)
        .then(result => ({
          pageNumber: page.pageNumber,
          bill_items: result.bill_items,
          tokenUsage: result.tokenUsage
        }))
    );

    const results = await Promise.all(extractionPromises);
    
    return results;
  } catch (error) {
    throw new Error(`Multi-page extraction failed: ${error.message}`);
  }
}


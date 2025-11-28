import { processDocument } from '../utils/fileHandler.js';
import { extractTextFromPages } from '../utils/ocr.js';
import { extractBillItemsFromPages } from '../utils/langchainExtractor.js';
import { reconcileAllPages } from '../utils/reconciliation.js';
import { detectFraud } from '../utils/fraudDetection.js';
import { detectPageType } from '../utils/pageTypeDetector.js';
import { TokenTracker } from '../utils/tokenTracker.js';

/**
 * Main extraction function
 */
export async function extractBill(documentUrl) {
  let cleanup = null;
  const tokenTracker = new TokenTracker();
  
  try {
    // Step 1: Download and process document
    console.log('📥 Downloading and processing document...');
    const { imagePaths, cleanup: cleanupFn } = await processDocument(documentUrl);
    cleanup = cleanupFn;
    
    if (!imagePaths || imagePaths.length === 0) {
      throw new Error('No images extracted from document');
    }

    // Step 2: OCR extraction
    console.log(`🔍 Performing OCR on ${imagePaths.length} page(s)...`);
    const ocrResults = await extractTextFromPages(imagePaths);
    
    console.log("ocrResults----> ", ocrResults);
    if (ocrResults.length === 0) {
      throw new Error('No text extracted from document');
    }

    // Step 3: LLM extraction with token tracking
    console.log('🤖 Extracting bill items using LLM...');
    const extractionResults = await extractBillItemsFromPages(ocrResults, tokenTracker);
    
    // Step 4: Build pagewise structure with page_type
    const pagewiseLineItems = extractionResults.map((result, index) => {
      const ocrText = ocrResults[index]?.text || '';
      const pageType = detectPageType(ocrText);
      
      return {
        page_no: result.pageNumber.toString(),
        page_type: pageType,
        bill_items: result.bill_items || []
      };
    });

    // Step 5: Reconciliation
    console.log('✅ Reconciling amounts...');
    const reconciled = reconcileAllPages(pagewiseLineItems);

    // Step 6: Build final response matching exact API format
    const response = {
      is_success: true,
      token_usage: tokenTracker.getUsage(),
      data: {
        pagewise_line_items: reconciled.pagewise_line_items,
        total_item_count: reconciled.total_item_count
      }
    };

    console.log(`✅ Extraction complete: ${reconciled.total_item_count} items`);
    const tokenUsage = tokenTracker.getUsage();
    console.log(`📊 Token usage:`, tokenUsage);
    
    // Log if no tokens were used (likely tableParser was used)
    if (tokenUsage.total_tokens === 0) {
      console.log('ℹ️  No LLM tokens used - tableParser was likely used for deterministic parsing');
    }

    return response;
  } catch (error) {
    console.error('Extraction error:', error);
    throw error;
  } finally {
    // Cleanup temporary files
    if (cleanup) {
      cleanup();
    }
  }
}


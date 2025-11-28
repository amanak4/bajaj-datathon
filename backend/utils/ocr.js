import Tesseract from 'tesseract.js';
import { preprocessImagePipeline } from './imagePreprocessor.js';

/**
 * Extract text from image using Tesseract OCR
 */
export async function extractTextFromImage(imagePath) {
  try {
    // Preprocess image for better OCR accuracy
    const processedBuffer = await preprocessImagePipeline(imagePath);
    
    // Perform OCR with optimized settings
    const tesseractOptions = {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.%/-:,() ',
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: '6', // Assume a single uniform block of text
      tessedit_ocr_engine_mode: '1', // LSTM only
      logger: (info) => {
        if (info.status === 'recognizing text') {
          // Optional: add progress logging
        }
      }
    };

    const { data: { text, confidence } } = await Tesseract.recognize(
      processedBuffer,
      'eng',
      tesseractOptions
    );

    return {
      text: text.trim(),
      confidence: confidence || 0
    };
  } catch (error) {
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from multiple images (pages)
 */
export async function extractTextFromPages(imagePaths) {
  try {
    // Process pages in parallel for better performance
    const ocrPromises = imagePaths.map((imagePath, index) => 
      extractTextFromImage(imagePath).then(result => ({
        pageNumber: index + 1,
        text: result.text,
        confidence: result.confidence
      }))
    );

    const results = await Promise.all(ocrPromises);
    
    return results;
  } catch (error) {
    throw new Error(`Multi-page OCR failed: ${error.message}`);
  }
}


import sharp from 'sharp';
import fs from 'fs-extra';

/**
 * Advanced image preprocessing for better OCR accuracy
 */
export async function preprocessImage(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const baseImage = sharp(imageBuffer);
    const metadata = await baseImage.metadata();

    const hasWidth = typeof metadata.width === 'number' && metadata.width > 0;
    const needsUpscale = hasWidth && metadata.width < 1800;

    const resizeWidth = needsUpscale
      ? Math.min(Math.round(metadata.width * 1.7), 2400)
      : undefined;

    let pipeline = baseImage
      .ensureAlpha()
      .removeAlpha()
      .grayscale()
      .normalize();

    if (resizeWidth) {
      pipeline = pipeline.resize({
        width: resizeWidth,
        kernel: sharp.kernel.lanczos3
      });
    }

    const processedBuffer = await pipeline
      .median(1) // Reduce salt & pepper noise
      .linear(1.1, -10) // Slight contrast boost
      .sharpen({ sigma: 1.2 })
      .threshold(170) // Adaptive-like threshold
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    throw new Error(`Image preprocessing failed: ${error.message}`);
  }
}

/**
 * Detect if image is skewed (deskewing preparation)
 */
export async function detectSkew(imageBuffer) {
  // Simple skew detection - can be enhanced with more sophisticated algorithms
  // For now, return 0 (no skew detected)
  // In production, you might use libraries like 'opencv4nodejs' for better deskewing
  return 0;
}

/**
 * Apply deskewing to image
 */
export async function deskewImage(imageBuffer, angle) {
  if (Math.abs(angle) < 0.5) {
    return imageBuffer; // No significant skew
  }

  try {
    return await sharp(imageBuffer)
      .rotate(angle)
      .toBuffer();
  } catch (error) {
    console.warn('Deskewing failed, using original:', error.message);
    return imageBuffer;
  }
}

/**
 * Full preprocessing pipeline
 */
export async function preprocessImagePipeline(imagePath) {
  try {
    // Step 1: Basic preprocessing
    let processedBuffer = await preprocessImage(imagePath);
    
    // Step 2: Detect and correct skew
    const skewAngle = await detectSkew(processedBuffer);
    processedBuffer = await deskewImage(processedBuffer, skewAngle);
    
    // Step 3: Final sharpening
    processedBuffer = await sharp(processedBuffer)
      .sharpen({ sigma: 2 })
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    throw new Error(`Preprocessing pipeline failed: ${error.message}`);
  }
}


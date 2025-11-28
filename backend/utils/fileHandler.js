import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfPoppler from 'pdf-poppler';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../temp');
const UPLOADS_DIR = path.join(TEMP_DIR, 'uploads');
const PROCESSED_DIR = path.join(TEMP_DIR, 'processed');

// Ensure directories exist
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(PROCESSED_DIR);

/**
 * Download file from URL
 */
export async function downloadFile(url, outputPath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * Detect file type from URL or file path
 */
export function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return 'pdf';
  } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext)) {
    return 'image';
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Convert PDF to images
 */
export async function pdfToImages(pdfPath, outputDir) {
  try {
    // Check if poppler is available
    const options = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: 'page',
      page: null // Convert all pages
    };

    await pdfPoppler.convert(pdfPath, options);
    
    // Wait a bit for files to be written
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get all generated images
    const files = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('page') && file.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    if (files.length === 0) {
      throw new Error('No images generated from PDF. Please ensure Poppler is installed.');
    }

    return files.map(file => path.join(outputDir, file));
  } catch (error) {
    if (error.message.includes('poppler') || error.message.includes('Poppler')) {
      throw new Error(`PDF conversion failed. Please install Poppler: ${error.message}`);
    }
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

/**
 * Process document URL and return image paths
 */
export async function processDocument(documentUrl) {
  try {
    // Generate unique ID for this request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestDir = path.join(UPLOADS_DIR, requestId);
    fs.ensureDirSync(requestDir);

    // Download file
    const urlPath = new URL(documentUrl).pathname;
    const fileName = path.basename(urlPath) || `document_${requestId}${path.extname(urlPath) || '.pdf'}`;
    const downloadedPath = path.join(requestDir, fileName);
    
    await downloadFile(documentUrl, downloadedPath);
    
    // Detect file type
    const fileType = detectFileType(downloadedPath);
    
    let imagePaths = [];
    
    if (fileType === 'pdf') {
      // Convert PDF to images
      const imagesDir = path.join(requestDir, 'images');
      fs.ensureDirSync(imagesDir);
      imagePaths = await pdfToImages(downloadedPath, imagesDir);
    } else {
      // For images, use directly
      imagePaths = [downloadedPath];
    }

    // Cleanup function
    const cleanup = () => {
      try {
        fs.removeSync(requestDir);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    };

    return {
      imagePaths,
      fileType,
      requestId,
      cleanup
    };
  } catch (error) {
    throw new Error(`Document processing failed: ${error.message}`);
  }
}


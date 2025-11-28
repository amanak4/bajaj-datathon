import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';

const execAsync = promisify(exec);

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
 * Convert PDF to images using pdftoppm (Poppler utility)
 * Uses system command directly - works on Linux/Docker
 */
export async function pdfToImages(pdfPath, outputDir) {
  try {
    // Use pdftoppm command directly (Poppler utility)
    // -png: output format
    // -r 200: resolution (200 DPI)
    // output prefix: page
    const outputPrefix = path.join(outputDir, 'page');
    
    // Run pdftoppm command
    const command = `pdftoppm -png -r 200 "${pdfPath}" "${outputPrefix}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Writing')) {
        console.warn('pdftoppm stderr:', stderr);
      }
    } catch (execError) {
      // Check if pdftoppm is available
      if (execError.message.includes('pdftoppm') || execError.message.includes('command not found')) {
        throw new Error('pdftoppm command not found. Please ensure Poppler is installed: apt-get install -y poppler-utils');
      }
      throw execError;
    }
    
    // Wait a bit for files to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get all generated images
    const files = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('page') && (file.endsWith('.png') || /page-\d+\.png/.test(file)))
      .sort((a, b) => {
        // Extract page number from filename (page-1.png, page-2.png, etc.)
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    if (files.length === 0) {
      throw new Error('No images generated from PDF. Please ensure Poppler is installed and pdftoppm is available.');
    }

    return files.map(file => path.join(outputDir, file));
  } catch (error) {
    if (error.message.includes('pdftoppm') || error.message.includes('command not found')) {
      throw new Error(`PDF conversion failed. Poppler must be installed. Error: ${error.message}`);
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


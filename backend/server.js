import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractBill } from './api/extractBill.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Bill Extraction API is running' });
});

// Main extraction endpoint - matches exact API specification
app.post('/extract-bill-data', async (req, res) => {
  try {
    const { document } = req.body;
    
    if (!document) {
      return res.status(400).json({
        is_success: false,
        error: 'Document URL is required'
      });
    }

    const result = await extractBill(document);
    
    // Return with status 200 as per API specification
    res.status(200).json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(200).json({
      is_success: false,
      token_usage: {
        total_tokens: 0,
        input_tokens: 0,
        output_tokens: 0
      },
      error: error.message || 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});


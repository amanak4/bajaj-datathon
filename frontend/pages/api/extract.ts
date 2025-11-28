import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({ error: 'Document URL is required' });
    }

    // Proxy request to backend - using correct endpoint
    const response = await axios.post(`${BACKEND_URL}/extract-bill-data`, {
      document
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({
      is_success: false,
      error: error.response?.data?.error || error.message || 'Internal server error'
    });
  }
}


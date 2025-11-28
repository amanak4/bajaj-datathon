import { useState } from 'react';
import axios from 'axios';

interface BillItem {
  item_name: string;
  item_rate: number;
  item_quantity: number;
  item_amount: number;
}

interface PageLineItems {
  page_no: string;
  bill_items: BillItem[];
}

interface ExtractionResult {
  is_success: boolean;
  data: {
    pagewise_line_items: PageLineItems[];
    total_item_count: number;
    reconciled_amount: number;
    fraud_flags?: string[];
  };
  error?: string;
}

export default function Home() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!documentUrl.trim()) {
      setError('Please enter a document URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post<ExtractionResult>('/api/extract', {
        document: documentUrl
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to extract bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>
        📄 Bill Extraction AI System
      </h1>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Upload Document</h2>
        <input
          type="text"
          className="input"
          placeholder="Enter document URL (PDF or image)"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          disabled={loading}
        />
        <button
          className="button"
          onClick={handleExtract}
          disabled={loading || !documentUrl.trim()}
        >
          {loading ? 'Extracting...' : 'Extract Bill'}
        </button>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <p>Processing document... This may take a few moments.</p>
        </div>
      )}

      {result && result.is_success && (
        <div>
          <div className="card success">
            <h2>✅ Extraction Successful</h2>
            <p>
              <strong>Total Items:</strong> {result.data.total_item_count}
            </p>
            <p>
              <strong>Reconciled Amount:</strong> ₹{result.data.reconciled_amount.toFixed(2)}
            </p>
            {result.data.fraud_flags && result.data.fraud_flags.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Fraud Flags:</strong>
                <ul>
                  {result.data.fraud_flags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.data.pagewise_line_items.map((page, pageIdx) => (
            <div key={pageIdx} className="card">
              <h2>Page {page.page_no}</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Rate</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {page.bill_items.map((item, itemIdx) => (
                    <tr key={itemIdx}>
                      <td>{item.item_name}</td>
                      <td>₹{item.item_rate.toFixed(2)}</td>
                      <td>{item.item_quantity.toFixed(2)}</td>
                      <td>₹{item.item_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <strong>
                  Page Total: ₹
                  {page.bill_items
                    .reduce((sum, item) => sum + item.item_amount, 0)
                    .toFixed(2)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, Briefcase, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface QuoteData {
  id: number;
  quote_number: string;
  client_id: string;
  client_name: string;
  date: string;
  valid_until: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  terms: string;
  items: {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
      } else {
        console.error('Quote not found');
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchQuote();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const convertToJob = async () => {
    if (!confirm('Are you sure you want to convert this quote to a print job?')) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/quotes/${id}/convert-to-job`, { method: 'POST' });
      if (res.ok) {
        alert('Converted to Print Job successfully!');
        fetchQuote(); // Refresh to show updated status
      } else {
        alert('Failed to convert to Print Job.');
      }
    } catch (error) {
      console.error('Error converting to job:', error);
    } finally {
      setConverting(false);
    }
  };

  const convertToInvoice = async () => {
    if (!confirm('Are you sure you want to convert this quote to an invoice?')) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/quotes/${id}/convert-to-invoice`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert('Converted to Invoice successfully!');
        navigate(`/invoice/${data.id}`);
      } else {
        alert('Failed to convert to Invoice.');
      }
    } catch (error) {
      console.error('Error converting to invoice:', error);
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading quote details...</div>;
  }

  if (!quote) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Quote Not Found</h2>
        <button
          onClick={() => navigate('/quotes')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Return to Quotes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 print:hidden gap-4">
        <button
          onClick={() => navigate('/quotes')}
          className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <div className="flex flex-wrap gap-3">
          {quote.status !== 'Accepted' && quote.status !== 'Rejected' && (
            <>
              <button
                onClick={() => updateStatus('Accepted')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Accepted
              </button>
            </>
          )}

          {quote.status === 'Accepted' && (
            <>
              <button
                onClick={convertToJob}
                disabled={converting}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Convert to Job
              </button>
              <button
                onClick={convertToInvoice}
                disabled={converting}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Convert to Invoice
              </button>
            </>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Quote
          </button>
        </div>
      </div>

      {/* Printable Quote Container */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ESTIMATE</h1>
              <p className="text-slate-500 mt-1 font-medium">{quote.quote_number}</p>
              <div className="mt-2 print:hidden">
                <span className={clsx(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  quote.status === 'Accepted' && "bg-emerald-100 text-emerald-800",
                  quote.status === 'Sent' && "bg-blue-100 text-blue-800",
                  quote.status === 'Draft' && "bg-slate-100 text-slate-800",
                  quote.status === 'Rejected' && "bg-rose-100 text-rose-800"
                )}>
                  {quote.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-indigo-600 tracking-tight">PrintFlow Inc.</div>
              <p className="text-sm text-slate-500 mt-1">123 Business Rd.</p>
              <p className="text-sm text-slate-500">Suite 100</p>
              <p className="text-sm text-slate-500">Cityville, ST 12345</p>
              <p className="text-sm text-slate-500 mt-2">sales@printflow.example.com</p>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prepared For</h3>
              <p className="text-lg font-semibold text-slate-900">{quote.client_name}</p>
              <p className="text-sm text-slate-500 mt-1">Client ID: {quote.client_id}</p>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3>
                  <p className="text-sm font-medium text-slate-900">{format(new Date(quote.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valid Until</h3>
                  <p className="text-sm font-medium text-slate-900">{format(new Date(quote.valid_until), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Total</h3>
                <p className="text-2xl font-bold text-slate-900">${quote.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 text-sm font-bold text-slate-700 uppercase tracking-wider">Description</th>
                  <th className="py-3 text-sm font-bold text-slate-700 uppercase tracking-wider text-right">Qty</th>
                  <th className="py-3 text-sm font-bold text-slate-700 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="py-3 text-sm font-bold text-slate-700 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 text-sm text-slate-900">{item.description}</td>
                    <td className="py-4 text-sm text-slate-700 text-right">{item.quantity}</td>
                    <td className="py-4 text-sm text-slate-700 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="py-4 text-sm font-medium text-slate-900 text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">${quote.subtotal.toFixed(2)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount</span>
                  <span className="font-medium text-emerald-600">-${quote.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax ({quote.tax_rate}%)</span>
                <span className="font-medium text-slate-900">${quote.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200">
                <span className="text-base font-bold text-slate-900">Estimated Total</span>
                <span className="text-xl font-bold text-indigo-600">${quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          {quote.terms && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Terms & Conditions</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line">{quote.terms}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500 font-medium">This is an estimate, not a tax invoice.</p>
            <p className="text-xs text-slate-400 mt-2">
              To proceed with this order, please confirm your acceptance of this quote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

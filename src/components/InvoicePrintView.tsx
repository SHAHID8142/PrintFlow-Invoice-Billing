import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceData {
  id: number;
  invoice_number: string;
  client_id: string;
  client_name: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: string;
  items: {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

export default function InvoicePrintView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        } else {
          console.error('Invoice not found');
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invoice Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Return to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">INVOICE</h1>
              <p className="text-slate-500 mt-1 font-medium">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-indigo-600 tracking-tight">PrintFlow Inc.</div>
              <p className="text-sm text-slate-500 mt-1">123 Business Rd.</p>
              <p className="text-sm text-slate-500">Suite 100</p>
              <p className="text-sm text-slate-500">Cityville, ST 12345</p>
              <p className="text-sm text-slate-500 mt-2">billing@printflow.example.com</p>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
              <p className="text-lg font-semibold text-slate-900">{invoice.client_name}</p>
              <p className="text-sm text-slate-500 mt-1">Client ID: {invoice.client_id}</p>
              {/* Add more client address details here if available in DB */}
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Issued</h3>
                  <p className="text-sm font-medium text-slate-900">{format(new Date(invoice.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</h3>
                  <p className="text-sm font-medium text-slate-900">{format(new Date(invoice.due_date), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount Due</h3>
                <p className="text-2xl font-bold text-slate-900">${invoice.total.toFixed(2)}</p>
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
                {invoice.items.map((item, index) => (
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
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount</span>
                  <span className="font-medium text-emerald-600">-${invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span className="font-medium text-slate-900">${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500 font-medium">Thank you for your business!</p>
            <p className="text-xs text-slate-400 mt-2">
              Payment is due within 30 days. Please make checks payable to PrintFlow Inc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

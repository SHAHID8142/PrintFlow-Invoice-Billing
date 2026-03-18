import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, FileText, ChevronRight, DollarSign, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface LedgerItem {
  id: number;
  reference: string;
  date: string;
  amount: number;
  type: 'invoice' | 'payment';
  status: string;
  balance: number;
}

interface ClientProfileData {
  id: number;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  tax_id: string | null;
  total_spent: number;
  outstanding_dues: number;
}

function RecordPaymentModal({ 
  isOpen, 
  onClose, 
  clientId, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  clientId: string;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
          receipt_number: receiptNumber,
          notes
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
        setAmount('');
        setReceiptNumber('');
        setNotes('');
      } else {
        console.error('Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900/75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-medium leading-6 text-slate-900">Record Payment</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Amount</label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-7 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Check">Check</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Receipt / Ref Number (Optional)</label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="mt-1 block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3"
              />
            </div>

            <div className="mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Record Payment'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientProfileData | null>(null);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      const [clientRes, ledgerRes] = await Promise.all([
        fetch(`/api/clients/${id}`),
        fetch(`/api/clients/${id}/ledger`)
      ]);

      if (clientRes.ok && ledgerRes.ok) {
        setClient(await clientRes.json());
        setLedger(await ledgerRes.json());
      } else {
        console.error('Failed to fetch client data');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading client profile...</div>;
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Client Not Found</h2>
        <button
          onClick={() => navigate('/clients')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Return to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {client.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.full_name}</h1>
              {client.company_name && (
                <div className="flex items-center text-sm text-slate-500 mt-1">
                  <Building2 className="h-4 w-4 mr-1.5" />
                  {client.company_name}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Statement
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </button>
          <Link
            to={`/create?client=${client.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Statement of Account</h1>
        <p className="text-slate-500 mt-2">Generated on {format(new Date(), 'MMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        {/* Left Column: Contact Info & Stats */}
        <div className="space-y-8 print:flex print:justify-between print:space-y-0 print:mb-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 print:w-1/2 print:pr-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-slate-900">${client.total_spent.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Outstanding</p>
              <p className={clsx("text-2xl font-bold", client.outstanding_dues > 0 ? "text-rose-600" : "text-slate-900")}>
                ${client.outstanding_dues.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:w-1/2 print:border-none print:shadow-none">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Details</h2>
            </div>
            <div className="p-6 space-y-4 print:p-0">
              <h2 className="hidden print:block text-lg font-bold text-slate-900 mb-2">{client.full_name}</h2>
              {client.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-slate-400 mr-3 mt-0.5 print:hidden" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 print:hidden">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-indigo-600 hover:text-indigo-800 print:text-slate-900">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-slate-400 mr-3 mt-0.5 print:hidden" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 print:hidden">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-sm text-slate-600 hover:text-slate-900 print:text-slate-900">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.billing_address && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-slate-400 mr-3 mt-0.5 print:hidden" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 print:hidden">Billing Address</p>
                    <p className="text-sm text-slate-600 whitespace-pre-line print:text-slate-900">{client.billing_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Ledger */}
        <div className="lg:col-span-2 print:col-span-1 print:mt-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:bg-white print:px-0 print:border-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Customer Ledger</h2>
              <span className="bg-slate-200 text-slate-700 py-0.5 px-2.5 rounded-full text-xs font-medium print:hidden">
                {ledger.length} Transactions
              </span>
            </div>
            
            {ledger.length === 0 ? (
              <div className="p-12 text-center print:hidden">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No transactions yet</h3>
                <p className="mt-1 text-sm text-slate-500">Create an invoice or record a payment to start tracking.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 print:bg-white">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:px-0">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider print:px-0">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {ledger.map((item, index) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap print:px-0">
                          <div className="text-sm text-slate-900">
                            {format(new Date(item.date), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.type === 'invoice' ? (
                              <Link to={`/invoice/${item.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900 print:text-slate-900">
                                {item.reference}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium text-slate-900">
                                {item.reference || 'Payment'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={clsx(
                              'px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full print:p-0 print:bg-transparent',
                              {
                                'bg-indigo-100 text-indigo-800': item.type === 'invoice',
                                'bg-emerald-100 text-emerald-800': item.type === 'payment',
                              }
                            )}
                          >
                            {item.type === 'invoice' ? 'Invoice' : 'Payment'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={clsx(
                            "text-sm font-medium",
                            item.type === 'invoice' ? "text-slate-900" : "text-emerald-600"
                          )}>
                            {item.type === 'invoice' ? '' : '-'}${item.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right print:px-0">
                          <div className="text-sm font-bold text-slate-900">
                            ${item.balance.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clientId={id!}
        onSuccess={fetchClientData}
      />
    </div>
  );
}

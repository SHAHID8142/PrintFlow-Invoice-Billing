import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Building2, Phone, Mail, MapPin, FileText, Tag, DollarSign, User, X } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface LedgerItem {
  id: number;
  reference: string;
  date: string;
  amount: number;
  type: 'bill' | 'payment';
  status: string;
  balance: number;
}

interface Supplier {
  id: number;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  supply_category: string | null;
  total_spent: number;
  outstanding_dues: number;
}

function RecordSupplierPaymentModal({ 
  isOpen, 
  onClose, 
  supplierId, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  supplierId: string;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          date: paymentDate,
          payment_method: paymentMethod,
          reference_number: referenceNumber
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
        setAmount('');
        setReferenceNumber('');
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
            <h3 className="text-lg font-medium leading-6 text-slate-900">Record Payment to Supplier</h3>
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
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-7 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1 block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Reference Number (Optional)</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="mt-1 block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3"
                placeholder="e.g., Check #1234"
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

export default function SupplierProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchSupplierData();
  }, [id]);

  const fetchSupplierData = async () => {
    try {
      const [supplierRes, ledgerRes] = await Promise.all([
        fetch(`/api/suppliers/${id}`),
        fetch(`/api/suppliers/${id}/ledger`)
      ]);

      if (supplierRes.ok && ledgerRes.ok) {
        setSupplier(await supplierRes.json());
        setLedger(await ledgerRes.json());
      } else {
        navigate('/suppliers');
      }
    } catch (error) {
      console.error('Failed to fetch supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this supplier? Their expenses will be kept but unlinked.')) {
      try {
        const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        if (response.ok) {
          navigate('/suppliers');
        }
      } catch (error) {
        console.error('Failed to delete supplier:', error);
      }
    }
  };

  if (loading || !supplier) {
    return <div className="p-8 text-center text-slate-500">Loading supplier profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{supplier.company_name}</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center">
              {supplier.supply_category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 mr-2">
                  <Tag className="h-3 w-3 mr-1" />
                  {supplier.supply_category}
                </span>
              )}
              Supplier Profile
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </button>
          <Link
            to={`/suppliers/${id}/edit`}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Contact Information</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {supplier.contact_person && (
                <div className="flex items-start">
                  <User className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Contact Person</p>
                    <p className="text-sm text-slate-500">{supplier.contact_person}</p>
                  </div>
                </div>
              )}
              
              {supplier.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email</p>
                    <a href={`mailto:${supplier.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {supplier.email}
                    </a>
                  </div>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone</p>
                    <a href={`tel:${supplier.phone}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {supplier.phone}
                    </a>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Address</p>
                    <p className="text-sm text-slate-500 whitespace-pre-line">{supplier.address}</p>
                  </div>
                </div>
              )}

              {supplier.tax_id && (
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Tax / VAT ID</p>
                    <p className="text-sm text-slate-500">{supplier.tax_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden mt-6">
             <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Financial Summary</h3>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-rose-50 rounded-lg mr-4">
                    <DollarSign className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Outstanding Dues</p>
                    <p className="text-2xl font-bold text-slate-900">${supplier.outstanding_dues.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-slate-50 rounded-lg mr-4">
                    <Building2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Lifetime Billed</p>
                    <p className="text-xl font-bold text-slate-900">${supplier.total_spent.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Supplier Ledger */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Supplier Ledger</h3>
              <span className="bg-white text-slate-600 py-0.5 px-2.5 rounded-full text-xs font-medium border border-slate-200 shadow-sm">
                {ledger.length} records
              </span>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {format(new Date(item.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {item.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            item.type === 'bill' ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                          )}>
                            {item.type === 'bill' ? 'Bill' : 'Payment'}
                          </span>
                        </td>
                        <td className={clsx(
                          "px-6 py-4 whitespace-nowrap text-sm font-medium text-right",
                          item.type === 'bill' ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {item.type === 'bill' ? '+' : '-'}${item.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                          ${item.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <RecordSupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        supplierId={id!}
        onSuccess={fetchSupplierData}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Calculator } from 'lucide-react';
import { format } from 'date-fns';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Client {
  id: number;
  full_name: string;
  company_name: string | null;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultClientId = searchParams.get('client') || '';
  
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Form State
  const [clientId, setClientId] = useState(defaultClientId);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Unpaid');
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(8.5); // Default 8.5%
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + taxAmount;

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0, total: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate line total
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Please select a client');
      return;
    }

    setLoading(true);
    const clientName = clients.find(c => c.id.toString() === clientId)?.full_name || 'Unknown';

    const invoiceData = {
      client_id: clientId,
      client_name: clientName,
      date,
      due_date: dueDate,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount,
      total,
      status,
      items: items.filter(item => item.description.trim() !== '') // Filter empty items
    };

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/invoice/${data.id}`);
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Invoice</h1>
            <p className="text-sm text-slate-500 mt-1">Fill in the details to generate a new invoice.</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Invoice
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client Details */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label htmlFor="client" className="block text-sm font-medium text-slate-700 mb-1">
                  Select Client *
                </label>
                <select
                  id="client"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={loadingClients}
                  className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white disabled:opacity-50"
                >
                  <option value="" disabled>
                    {loadingClients ? 'Loading clients...' : 'Select a client...'}
                  </option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name} {client.company_name ? `(${client.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  id="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
            </div>
            
            <div className="space-y-4">
              {/* Header Row */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-2 py-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items */}
              {items.map((item, index) => (
                <div key={item.id} className="group relative grid grid-cols-1 sm:grid-cols-12 gap-4 items-start sm:items-center p-4 sm:p-2 border border-slate-200 sm:border-transparent rounded-lg sm:hover:bg-slate-50 transition-colors">
                  <div className="sm:col-span-6">
                    <label className="block sm:hidden text-xs font-medium text-slate-500 mb-1">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="Item description..."
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block sm:hidden text-xs font-medium text-slate-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2 text-right"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block sm:hidden text-xs font-medium text-slate-500 mb-1">Unit Price</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="block w-full pl-7 border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 text-right"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end">
                    <label className="block sm:hidden text-xs font-medium text-slate-500">Total</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-900 w-full text-right">
                        ${item.total.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length === 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-4 inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
        </div>

        {/* Sidebar / Summary */}
        <div className="space-y-8">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 sticky top-24">
            <div className="flex items-center mb-6">
              <Calculator className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-600">
                <label htmlFor="discount" className="flex items-center">
                  Discount
                </label>
                <div className="relative w-24">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="discount"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="block w-full pl-6 pr-2 py-1 border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border text-right"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <label htmlFor="taxRate" className="flex items-center">
                  Tax Rate
                </label>
                <div className="relative w-24">
                  <input
                    type="number"
                    id="taxRate"
                    min="0"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="block w-full pr-6 pl-2 py-1 border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border text-right"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-slate-100">
                <span>Tax Amount</span>
                <span className="font-medium text-slate-900">${taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-indigo-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8">
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

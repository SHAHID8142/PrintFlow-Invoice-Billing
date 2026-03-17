import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, FileText, DollarSign, CreditCard, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: any;
}

const CATEGORIES = ['Materials', 'Utilities', 'Salaries', 'Maintenance', 'Equipment', 'Marketing', 'Services', 'Miscellaneous'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card'];

export default function ExpenseForm({ isOpen, onClose, onSuccess, expenseToEdit }: ExpenseFormProps) {
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Materials',
    description: '',
    amount: '',
    payment_method: 'Bank Transfer',
    supplier_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        date: expenseToEdit.date,
        category: expenseToEdit.category,
        description: expenseToEdit.description || '',
        amount: expenseToEdit.amount.toString(),
        payment_method: expenseToEdit.payment_method,
        supplier_id: expenseToEdit.supplier_id?.toString() || ''
      });
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        category: 'Materials',
        description: '',
        amount: '',
        payment_method: 'Bank Transfer',
        supplier_id: ''
      });
    }
  }, [expenseToEdit, isOpen]);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = expenseToEdit ? `/api/expenses/${expenseToEdit.id}` : '/api/expenses';
      const method = expenseToEdit ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const showSupplierDropdown = ['Materials', 'Maintenance', 'Equipment', 'Services'].includes(formData.category);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                  {expenseToEdit ? 'Edit Expense' : 'Log New Expense'}
                </h3>
                <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 bg-white"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {showSupplierDropdown && (
                  <div>
                    <label htmlFor="supplier_id" className="block text-sm font-medium text-slate-700 mb-1">Supplier / Vendor</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        id="supplier_id"
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={handleChange}
                        disabled={loadingSuppliers}
                        className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 bg-white disabled:opacity-50"
                      >
                        <option value="">-- Select a Supplier (Optional) --</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.company_name} {supplier.contact_person ? `(${supplier.contact_person})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={handleChange}
                      className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="payment_method" className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      id="payment_method"
                      name="payment_method"
                      required
                      value={formData.payment_method}
                      onChange={handleChange}
                      className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 bg-white"
                    >
                      {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                      placeholder="Brief description of the expense..."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

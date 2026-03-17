import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  currentStock: number;
  unit: string;
  onSuccess: () => void;
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  currentStock,
  unit,
  onSuccess
}: StockAdjustmentModalProps) {
  const [type, setType] = useState<'Add' | 'Remove'>('Add');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/${itemId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change_amount: quantity,
          type,
          reason
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setType('Add');
        setQuantity(1);
        setReason('');
      } else {
        throw new Error('Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                    Adjust Stock
                  </h3>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-700 font-medium">{itemName}</p>
                  <p className="text-xs text-slate-500 mt-1">Current Stock: {currentStock} {unit}</p>
                </div>

                <form id="stock-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setType('Add')}
                        className={`py-2 px-4 text-sm font-medium rounded-md border ${
                          type === 'Add' 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Add Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('Remove')}
                        className={`py-2 px-4 text-sm font-medium rounded-md border ${
                          type === 'Remove' 
                            ? 'bg-rose-50 border-rose-200 text-rose-700' 
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Remove Stock
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">
                      Quantity ({unit})
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      id="reason"
                      required
                      placeholder="e.g., Restock, Damaged, Manual Count"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              form="stock-form"
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm Adjustment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

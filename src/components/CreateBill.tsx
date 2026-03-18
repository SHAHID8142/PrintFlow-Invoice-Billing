import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Calculator } from 'lucide-react';
import { format } from 'date-fns';

interface LineItem {
  id: string;
  inventory_item_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface Supplier {
  id: number;
  company_name: string;
}

interface InventoryItem {
  id: number;
  name: string;
  cost_price: number;
}

export default function CreateBill() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  
  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', inventory_item_id: '', description: '', quantity: 1, unit_cost: 0, total: 0 }
  ]);

  useEffect(() => {
    const fetchSuppliers = async () => {
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

    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchSuppliers();
    fetchInventory();
  }, []);

  // Calculations
  const total = items.reduce((sum, item) => sum + item.total, 0);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), inventory_item_id: '', description: '', quantity: 1, unit_cost: 0, total: 0 }
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
        if (field === 'quantity' || field === 'unit_cost') {
          updatedItem.total = updatedItem.quantity * updatedItem.unit_cost;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleInventorySelect = (id: string, inventoryId: string) => {
    const selectedItem = inventory.find(item => item.id.toString() === inventoryId);
    if (selectedItem) {
      setItems(items.map(item => {
        if (item.id === id) {
          const updatedItem = { 
            ...item, 
            inventory_item_id: inventoryId,
            description: selectedItem.name, 
            unit_cost: selectedItem.cost_price,
            total: item.quantity * selectedItem.cost_price
          };
          return updatedItem;
        }
        return item;
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    if (!billNumber) {
      alert('Please enter a bill number');
      return;
    }

    setLoading(true);

    const billData = {
      supplier_id: supplierId,
      bill_number: billNumber,
      date,
      due_date: dueDate,
      total,
      items: items.filter(item => item.description.trim() !== '') // Filter empty items
    };

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      if (response.ok) {
        navigate('/bills'); // or to a specific bill detail page if you create one
      } else {
        throw new Error('Failed to create bill');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create bill. Please try again.');
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
            onClick={() => navigate('/bills')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log Vendor Bill</h1>
            <p className="text-sm text-slate-500 mt-1">Record a bill and auto-restock inventory items.</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/bills')}
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
                Save Bill
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Supplier Details */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Bill Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label htmlFor="supplier" className="block text-sm font-medium text-slate-700 mb-1">
                  Select Supplier *
                </label>
                <select
                  id="supplier"
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  disabled={loadingSuppliers}
                  className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white disabled:opacity-50"
                >
                  <option value="" disabled>
                    {loadingSuppliers ? 'Loading suppliers...' : 'Select a supplier...'}
                  </option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="billNumber" className="block text-sm font-medium text-slate-700 mb-1">
                  Bill Number *
                </label>
                <input
                  type="text"
                  id="billNumber"
                  required
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="e.g., INV-2023-001"
                  className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
                  Bill Date
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
              <h2 className="text-lg font-semibold text-slate-900">Items (Auto-Restock)</h2>
            </div>
            
            <div className="space-y-4">
              {/* Header Row */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-2 py-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-6">Inventory Item / Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Cost</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items */}
              {items.map((item, index) => (
                <div key={item.id} className="group relative grid grid-cols-1 sm:grid-cols-12 gap-4 items-start sm:items-center p-4 sm:p-2 border border-slate-200 sm:border-transparent rounded-lg sm:hover:bg-slate-50 transition-colors">
                  <div className="sm:col-span-6 space-y-2">
                    <label className="block sm:hidden text-xs font-medium text-slate-500 mb-1">Description</label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => handleInventorySelect(item.id, e.target.value)}
                        value={item.inventory_item_id}
                        className="block w-1/3 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2 bg-white"
                      >
                        <option value="" disabled>Select Item...</option>
                        {inventory.map(invItem => (
                          <option key={invItem.id} value={invItem.id}>{invItem.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="Item description..."
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="block w-2/3 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                      />
                    </div>
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
                    <label className="block sm:hidden text-xs font-medium text-slate-500 mb-1">Unit Cost</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-base font-bold text-slate-900">Total Amount</span>
                <span className="text-2xl font-bold text-indigo-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

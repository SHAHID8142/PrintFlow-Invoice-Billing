import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, Hash, Tag, Scale, DollarSign, AlertTriangle } from 'lucide-react';

export default function InventoryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: '',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    low_stock_threshold: 0
  });

  useEffect(() => {
    if (isEditMode) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/inventory/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          sku: data.sku || '',
          category: data.category || '',
          unit: data.unit || '',
          cost_price: data.cost_price || 0,
          selling_price: data.selling_price || 0,
          current_stock: data.current_stock || 0,
          low_stock_threshold: data.low_stock_threshold || 0
        });
      } else {
        console.error('Item not found');
        navigate('/inventory');
      }
    } catch (error) {
      console.error('Failed to fetch item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isEditMode ? `/api/inventory/${id}` : '/api/inventory';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/inventory');
      } else {
        throw new Error('Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading item details...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Inventory Item' : 'Add New Item'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditMode ? 'Update the item details below.' : 'Enter the details for the new inventory item.'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Item
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Item Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="Premium Glossy Paper A4"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-slate-700 mb-1">
                SKU / Code
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 font-mono"
                  placeholder="PPR-GLS-A4"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="Paper, Ink, Material..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-slate-700 mb-1">
                Unit of Measurement
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Scale className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 bg-white"
                >
                  <option value="">Select unit...</option>
                  <option value="Piece">Piece</option>
                  <option value="Ream">Ream</option>
                  <option value="Liter">Liter</option>
                  <option value="Roll">Roll</option>
                  <option value="Box">Box</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-slate-200 pt-6 mt-2">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Pricing & Stock</h3>
            </div>

            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-slate-700 mb-1">
                Cost Price
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  id="cost_price"
                  name="cost_price"
                  min="0"
                  step="0.01"
                  required
                  value={formData.cost_price}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="selling_price" className="block text-sm font-medium text-slate-700 mb-1">
                Selling Price
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  id="selling_price"
                  name="selling_price"
                  min="0"
                  step="0.01"
                  required
                  value={formData.selling_price}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="current_stock" className="block text-sm font-medium text-slate-700 mb-1">
                {isEditMode ? 'Current Stock (Read Only)' : 'Initial Stock'}
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="current_stock"
                  name="current_stock"
                  min="0"
                  required
                  disabled={isEditMode}
                  value={formData.current_stock}
                  onChange={handleChange}
                  className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              {isEditMode && (
                <p className="mt-1 text-xs text-slate-500">Use the adjustment tool on the dashboard to modify stock.</p>
              )}
            </div>

            <div>
              <label htmlFor="low_stock_threshold" className="block text-sm font-medium text-slate-700 mb-1">
                Low Stock Threshold
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AlertTriangle className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  id="low_stock_threshold"
                  name="low_stock_threshold"
                  min="0"
                  required
                  value={formData.low_stock_threshold}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
}

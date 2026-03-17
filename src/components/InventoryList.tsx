import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, Edit, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';
import StockAdjustmentModal from './StockAdjustmentModal';

interface InventoryItem {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string | null;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  low_stock_threshold: number;
}

export default function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAdjustmentModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your stock levels and pricing.</p>
        </div>
        <Link
          to="/inventory/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No items found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm ? 'Try adjusting your search query.' : 'Get started by adding a new inventory item.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredItems.map((item) => {
                  const isLowStock = item.current_stock <= item.low_stock_threshold;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="flex-shrink-0 h-5 w-5 text-slate-400 mr-3" />
                          <span className="text-sm font-medium text-slate-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500 font-mono">{item.sku || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500">{item.category || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={clsx(
                            "text-sm font-semibold mr-2",
                            isLowStock ? "text-rose-600" : "text-slate-900"
                          )}>
                            {item.current_stock} {item.unit}
                          </span>
                          {isLowStock && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">${item.selling_price.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Cost: ${item.cost_price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openAdjustmentModal(item)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            title="Adjust Stock"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            <ArrowDownRight className="h-4 w-4 -ml-1" />
                          </button>
                          <Link
                            to={`/inventory/${item.id}/edit`}
                            className="text-slate-400 hover:text-slate-600"
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <StockAdjustmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          currentStock={selectedItem.current_stock}
          unit={selectedItem.unit || 'units'}
          onSuccess={fetchInventory}
        />
      )}
    </div>
  );
}

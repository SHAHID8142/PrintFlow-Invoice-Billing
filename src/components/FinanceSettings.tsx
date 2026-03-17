import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSettings } from './SettingsContext';

export default function FinanceSettings() {
  const { settings, refreshSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    currency_symbol: '$',
    tax_rate: '0'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        currency_symbol: settings.currency_symbol || '$',
        tax_rate: settings.tax_rate || '0'
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await refreshSettings();
      }
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Financial Settings</h2>
          <p className="mt-1 text-sm text-slate-500">Configure default currency and tax rates for your invoices.</p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="currency_symbol" className="block text-sm font-medium text-slate-700">Default Currency Symbol</label>
            <div className="mt-1">
              <select id="currency_symbol" name="currency_symbol" value={formData.currency_symbol} onChange={handleChange} className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 bg-white">
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="¥">¥ (JPY)</option>
                <option value="₹">₹ (INR)</option>
                <option value="A$">A$ (AUD)</option>
                <option value="C$">C$ (CAD)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tax_rate" className="block text-sm font-medium text-slate-700">Default Tax/VAT Rate (%)</label>
            <div className="mt-1">
              <input type="number" step="0.01" min="0" name="tax_rate" id="tax_rate" value={formData.tax_rate} onChange={handleChange} className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

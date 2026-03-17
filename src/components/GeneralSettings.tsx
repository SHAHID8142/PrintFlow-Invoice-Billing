import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSettings } from './SettingsContext';

export default function GeneralSettings() {
  const { settings, refreshSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        shop_name: settings.shop_name || '',
        owner_name: settings.owner_name || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || ''
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          <h2 className="text-lg font-medium text-slate-900">General Profile</h2>
          <p className="mt-1 text-sm text-slate-500">This information will be displayed on your invoices and reports.</p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="shop_name" className="block text-sm font-medium text-slate-700">Shop Name</label>
            <div className="mt-1">
              <input type="text" name="shop_name" id="shop_name" value={formData.shop_name} onChange={handleChange} className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3" />
            </div>
          </div>

          <div>
            <label htmlFor="owner_name" className="block text-sm font-medium text-slate-700">Owner Name</label>
            <div className="mt-1">
              <input type="text" name="owner_name" id="owner_name" value={formData.owner_name} onChange={handleChange} className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3" />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
            <div className="mt-1">
              <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
            <div className="mt-1">
              <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">Physical Address</label>
            <div className="mt-1">
              <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3" />
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';

export default function ClientForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    email: '',
    phone: '',
    billing_address: '',
    tax_id: ''
  });

  useEffect(() => {
    if (isEditMode) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          email: data.email || '',
          phone: data.phone || '',
          billing_address: data.billing_address || '',
          tax_id: data.tax_id || ''
        });
      } else {
        console.error('Client not found');
        navigate('/clients');
      }
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isEditMode ? `/api/clients/${id}` : '/api/clients';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/clients/${isEditMode ? id : data.id}`);
      } else {
        throw new Error('Failed to save client');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading client details...</div>;
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
              {isEditMode ? 'Edit Client' : 'Add New Client'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditMode ? 'Update the client details below.' : 'Enter the details for the new client.'}
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
                Save Client
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
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="company_name" className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="billing_address" className="block text-sm font-medium text-slate-700 mb-1">
                Billing Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <textarea
                  id="billing_address"
                  name="billing_address"
                  rows={3}
                  value={formData.billing_address}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="123 Business Rd, Suite 100&#10;Cityville, ST 12345"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700 mb-1">
                Tax / VAT ID
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="tax_id"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}

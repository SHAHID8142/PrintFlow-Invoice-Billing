import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Briefcase, User, Calendar, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Client {
  id: number;
  full_name: string;
  company_name: string | null;
}

const STATUSES = ['Pending', 'In Production', 'Finishing', 'Ready for Pickup', 'Completed'];

export default function JobForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    description: '',
    status: 'Pending',
    due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchClients();
    if (isEditMode) {
      fetchJob();
    }
  }, [id]);

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

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.title || '',
          client_id: data.client_id?.toString() || '',
          description: data.description || '',
          status: data.status || 'Pending',
          due_date: data.due_date ? format(new Date(data.due_date), 'yyyy-MM-dd') : ''
        });
      } else {
        console.error('Job not found');
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isEditMode ? `/api/jobs/${id}` : '/api/jobs';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/jobs');
      } else {
        throw new Error('Failed to save job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Failed to save job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading job details...</div>;
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
              {isEditMode ? 'Edit Print Job' : 'Create New Job'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditMode ? 'Update the job details below.' : 'Enter the details for the new print job.'}
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
                Save Job
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
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Job Title *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="e.g., 500 Business Cards - Matte Finish"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="client_id" className="block text-sm font-medium text-slate-700 mb-1">
                Client *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  id="client_id"
                  name="client_id"
                  required
                  value={formData.client_id}
                  onChange={handleChange}
                  disabled={loadingClients}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 bg-white disabled:opacity-50"
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
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 mb-1">
                Due Date *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  required
                  value={formData.due_date}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircle className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 bg-white"
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Job Description / Specifications
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full pl-10 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2"
                  placeholder="Enter detailed specifications, paper type, finish, special instructions, etc."
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
}

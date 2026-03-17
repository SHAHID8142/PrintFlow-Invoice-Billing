import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Building2, Phone, Mail, MapPin, FileText, Tag, DollarSign, User } from 'lucide-react';
import ExpenseList from './ExpenseList';

interface Supplier {
  id: number;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  supply_category: string | null;
  total_spent: number;
  expenses: any[];
}

export default function SupplierProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const response = await fetch(`/api/suppliers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSupplier(data);
      } else {
        navigate('/suppliers');
      }
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this supplier? Their expenses will be kept but unlinked.')) {
      try {
        const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        if (response.ok) {
          navigate('/suppliers');
        }
      } catch (error) {
        console.error('Failed to delete supplier:', error);
      }
    }
  };

  if (loading || !supplier) {
    return <div className="p-8 text-center text-slate-500">Loading supplier profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{supplier.company_name}</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center">
              {supplier.supply_category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 mr-2">
                  <Tag className="h-3 w-3 mr-1" />
                  {supplier.supply_category}
                </span>
              )}
              Supplier Profile
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/suppliers/${id}/edit`}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Contact Information</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {supplier.contact_person && (
                <div className="flex items-start">
                  <User className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Contact Person</p>
                    <p className="text-sm text-slate-500">{supplier.contact_person}</p>
                  </div>
                </div>
              )}
              
              {supplier.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email</p>
                    <a href={`mailto:${supplier.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {supplier.email}
                    </a>
                  </div>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone</p>
                    <a href={`tel:${supplier.phone}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {supplier.phone}
                    </a>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Address</p>
                    <p className="text-sm text-slate-500 whitespace-pre-line">{supplier.address}</p>
                  </div>
                </div>
              )}

              {supplier.tax_id && (
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-slate-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Tax / VAT ID</p>
                    <p className="text-sm text-slate-500">{supplier.tax_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Financial Summary</h3>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-50 rounded-lg mr-4">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Spent</p>
                    <p className="text-2xl font-bold text-slate-900">${supplier.total_spent.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expense History */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Expense History</h3>
              <span className="bg-white text-slate-600 py-0.5 px-2.5 rounded-full text-xs font-medium border border-slate-200 shadow-sm">
                {supplier.expenses.length} records
              </span>
            </div>
            <div className="p-6 flex-1">
              {/* Reusing ExpenseList but hiding edit/delete for simplicity in this view, or we can pass empty handlers */}
              <ExpenseList 
                expenses={supplier.expenses} 
                loading={false} 
                onEdit={() => {}} 
                onDelete={() => {}} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

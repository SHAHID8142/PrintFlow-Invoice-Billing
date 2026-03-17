import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  total: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
}

interface ClientProfileData {
  id: number;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  tax_id: string | null;
  total_spent: number;
  outstanding_dues: number;
  invoices: Invoice[];
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        console.error('Client not found');
      }
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading client profile...</div>;
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Client Not Found</h2>
        <button
          onClick={() => navigate('/clients')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Return to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {client.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.full_name}</h1>
              {client.company_name && (
                <div className="flex items-center text-sm text-slate-500 mt-1">
                  <Building2 className="h-4 w-4 mr-1.5" />
                  {client.company_name}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/clients/${client.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
          <Link
            to={`/create?client=${client.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contact Info & Stats */}
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-slate-900">${client.total_spent.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Outstanding</p>
              <p className={clsx("text-2xl font-bold", client.outstanding_dues > 0 ? "text-rose-600" : "text-slate-900")}>
                ${client.outstanding_dues.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Details</h2>
            </div>
            <div className="p-6 space-y-4">
              {client.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-sm text-slate-600 hover:text-slate-900">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.billing_address && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Billing Address</p>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{client.billing_address}</p>
                  </div>
                </div>
              )}
              {client.tax_id && (
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Tax / VAT ID</p>
                    <p className="text-sm text-slate-600">{client.tax_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini-Ledger (Invoices) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Invoice History</h2>
              <span className="bg-slate-200 text-slate-700 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {client.invoices.length} Invoices
              </span>
            </div>
            
            {client.invoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No invoices yet</h3>
                <p className="mt-1 text-sm text-slate-500">Create an invoice to start tracking billing history.</p>
                <Link
                  to={`/create?client=${client.id}`}
                  className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Create first invoice <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {client.invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="flex-shrink-0 h-5 w-5 text-slate-400 mr-3" />
                            <span className="text-sm font-medium text-slate-900">{invoice.invoice_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500">
                            {format(new Date(invoice.date), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            ${invoice.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={clsx(
                              'px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                              {
                                'bg-emerald-100 text-emerald-800': invoice.status === 'Paid',
                                'bg-amber-100 text-amber-800': invoice.status === 'Partial',
                                'bg-rose-100 text-rose-800': invoice.status === 'Unpaid',
                              }
                            )}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/invoice/${invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

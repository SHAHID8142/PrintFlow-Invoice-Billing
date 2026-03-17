/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileText, PlusCircle, LayoutDashboard, Users, Package, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import InvoiceList from './components/InvoiceList';
import CreateInvoice from './components/CreateInvoice';
import InvoicePrintView from './components/InvoicePrintView';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ClientProfile from './components/ClientProfile';
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';
import JobBoard from './components/JobBoard';
import JobForm from './components/JobForm';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Invoices', icon: FileText },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/jobs', label: 'Production', icon: Briefcase },
    { path: '/create', label: 'Create Invoice', icon: PlusCircle },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <LayoutDashboard className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-semibold text-xl tracking-tight">PrintFlow</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "border-indigo-500 text-indigo-700" 
                        : "border-transparent text-slate-500 hover:border-indigo-500 hover:text-indigo-700"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        <Navigation />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<InvoiceList />} />
            <Route path="/create" element={<CreateInvoice />} />
            <Route path="/invoice/:id" element={<InvoicePrintView />} />
            
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id" element={<ClientProfile />} />
            <Route path="/clients/:id/edit" element={<ClientForm />} />
            
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/new" element={<InventoryForm />} />
            <Route path="/inventory/:id/edit" element={<InventoryForm />} />
            
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="/jobs/new" element={<JobForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

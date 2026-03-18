/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FileText, PlusCircle, LayoutDashboard, Users, Package, Briefcase, DollarSign, Building2, Settings, ClipboardList, Receipt, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import CreateInvoice from './components/CreateInvoice';
import InvoicePrintView from './components/InvoicePrintView';
import QuoteList from './components/QuoteList';
import CreateQuote from './components/CreateQuote';
import QuoteDetail from './components/QuoteDetail';
import BillList from './components/BillList';
import CreateBill from './components/CreateBill';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ClientProfile from './components/ClientProfile';
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';
import JobBoard from './components/JobBoard';
import JobForm from './components/JobForm';
import FinanceDashboard from './components/FinanceDashboard';
import SupplierList from './components/SupplierList';
import SupplierForm from './components/SupplierForm';
import SupplierProfile from './components/SupplierProfile';
import SettingsLayout from './components/SettingsLayout';
import { SettingsProvider } from './components/SettingsContext';

function Navigation() {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
    { path: '/quotes', label: 'Quotes', icon: ClipboardList, roles: ['Admin', 'Staff'] },
    { path: '/invoices', label: 'Invoices', icon: FileText, roles: ['Admin', 'Staff'] },
    { path: '/bills', label: 'Bills', icon: Receipt, roles: ['Admin'] },
    { path: '/clients', label: 'Clients', icon: Users, roles: ['Admin', 'Staff'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Staff'] },
    { path: '/jobs', label: 'Production', icon: Briefcase, roles: ['Admin', 'Staff'] },
    { path: '/finance', label: 'Finance', icon: DollarSign, roles: ['Admin'] },
    { path: '/suppliers', label: 'Suppliers', icon: Building2, roles: ['Admin'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
    { path: '/create', label: 'Create Invoice', icon: PlusCircle, roles: ['Admin', 'Staff'] },
  ];

  const navItems = allNavItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <LayoutDashboard className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-semibold text-xl tracking-tight">PrintFlow</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 overflow-x-auto">
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
          <div className="flex items-center">
            {currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-slate-700">
                  {currentUser.name} <span className="text-slate-400 font-normal">({currentUser.role})</span>
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/invoices" replace />; // Redirect staff to invoices if they try to access admin routes
  }
  
  return <>{children}</>;
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        <Navigation />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<ProtectedRoute allowedRoles={['Admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/quotes" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><QuoteList /></ProtectedRoute>} />
            <Route path="/quotes/new" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><CreateQuote /></ProtectedRoute>} />
            <Route path="/quotes/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><QuoteDetail /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><InvoiceList /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><CreateInvoice /></ProtectedRoute>} />
            <Route path="/invoice/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><InvoicePrintView /></ProtectedRoute>} />
            
            <Route path="/bills" element={<ProtectedRoute allowedRoles={['Admin']}><BillList /></ProtectedRoute>} />
            <Route path="/bills/new" element={<ProtectedRoute allowedRoles={['Admin']}><CreateBill /></ProtectedRoute>} />
            
            <Route path="/clients" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><ClientList /></ProtectedRoute>} />
            <Route path="/clients/new" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><ClientForm /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><ClientProfile /></ProtectedRoute>} />
            <Route path="/clients/:id/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><ClientForm /></ProtectedRoute>} />
            
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><InventoryList /></ProtectedRoute>} />
            <Route path="/inventory/new" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><InventoryForm /></ProtectedRoute>} />
            <Route path="/inventory/:id/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><InventoryForm /></ProtectedRoute>} />
            
            <Route path="/jobs" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><JobBoard /></ProtectedRoute>} />
            <Route path="/jobs/new" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><JobForm /></ProtectedRoute>} />
            
            <Route path="/finance" element={<ProtectedRoute allowedRoles={['Admin']}><FinanceDashboard /></ProtectedRoute>} />

            <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['Admin']}><SupplierList /></ProtectedRoute>} />
            <Route path="/suppliers/new" element={<ProtectedRoute allowedRoles={['Admin']}><SupplierForm /></ProtectedRoute>} />
            <Route path="/suppliers/:id" element={<ProtectedRoute allowedRoles={['Admin']}><SupplierProfile /></ProtectedRoute>} />
            <Route path="/suppliers/:id/edit" element={<ProtectedRoute allowedRoles={['Admin']}><SupplierForm /></ProtectedRoute>} />

            <Route path="/settings/*" element={<ProtectedRoute allowedRoles={['Admin']}><SettingsLayout /></ProtectedRoute>} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to={currentUser.role === 'Admin' ? '/' : '/invoices'} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

import React, { useState } from 'react';
import { Building2, DollarSign, Database } from 'lucide-react';
import clsx from 'clsx';
import GeneralSettings from './GeneralSettings';
import FinanceSettings from './FinanceSettings';
import SystemSettings from './SystemSettings';

type Tab = 'general' | 'finance' | 'system';

export default function SettingsLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const tabs = [
    { id: 'general', label: 'General Profile', icon: Building2 },
    { id: 'finance', label: 'Financial', icon: DollarSign },
    { id: 'system', label: 'System & Data', icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your shop preferences and system configuration.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={clsx(
                    "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={clsx(
                    "flex-shrink-0 -ml-1 mr-3 h-5 w-5",
                    activeTab === tab.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"
                  )} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'finance' && <FinanceSettings />}
            {activeTab === 'system' && <SystemSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

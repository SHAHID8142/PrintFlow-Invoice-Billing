import React from 'react';
import { Download, Upload } from 'lucide-react';

export default function SystemSettings() {
  const handleBackup = () => {
    alert('Backup Database action triggered. In the Electron app, this will open a save file dialog.');
    console.log('Backup Database triggered');
  };

  const handleRestore = () => {
    alert('Restore Database action triggered. In the Electron app, this will open a file selection dialog.');
    console.log('Restore Database triggered');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-slate-900">System & Data Management</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your local database backups and restores.</p>
      </div>

      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">Backup Database</h3>
            <p className="text-sm text-slate-500 mt-1">Export your entire database to a secure local file.</p>
          </div>
          <button
            onClick={handleBackup}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2" />
            Backup Data
          </button>
        </div>

        <div className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">Restore Database</h3>
            <p className="text-sm text-slate-500 mt-1">Import a previously saved database backup file.</p>
          </div>
          <button
            onClick={handleRestore}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-rose-700 bg-white hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors whitespace-nowrap"
          >
            <Upload className="h-4 w-4 mr-2" />
            Restore Data
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, User, AlignLeft, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: number;
  title: string;
  client_id: number;
  client_name: string;
  company_name: string | null;
  description: string | null;
  status: string;
  due_date: string;
}

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  onSuccess: () => void;
}

const STATUSES = ['Pending', 'In Production', 'Finishing', 'Ready for Pickup', 'Completed'];

export default function JobDetailModal({ isOpen, onClose, jobId, onSuccess }: JobDetailModalProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: ''
  });

  useEffect(() => {
    if (isOpen && jobId) {
      fetchJob();
    }
  }, [isOpen, jobId]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        setEditData({
          title: data.title,
          description: data.description || '',
          due_date: data.due_date,
          status: data.status
        });
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setJob(prev => prev ? { ...prev, status: newStatus } : null);
        setEditData(prev => ({ ...prev, status: newStatus }));
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          client_id: job?.client_id // Keep existing client
        })
      });
      
      if (response.ok) {
        setIsEditing(false);
        fetchJob();
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {loading || !job ? (
            <div className="p-8 text-center text-slate-500">Loading job details...</div>
          ) : (
            <>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex-1 pr-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="block w-full text-xl font-bold border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <h3 className="text-xl font-bold text-slate-900" id="modal-title">
                        {job.title}
                      </h3>
                    )}
                    <div className="flex items-center mt-2 text-sm text-slate-500">
                      <User className="h-4 w-4 mr-1.5" />
                      {job.client_name} {job.company_name ? `(${job.company_name})` : ''}
                    </div>
                  </div>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Pipeline */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Production Stage
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                            job.status === s
                              ? s === 'Completed'
                                ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                                : 'bg-indigo-100 border-indigo-200 text-indigo-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Due Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Due Date
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.due_date}
                          onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                          className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="flex items-center text-sm text-slate-900">
                          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                          {format(new Date(job.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description / Specs */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Job Specifications
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="block w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter job specifications, paper type, finish, etc."
                      />
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        {job.description ? (
                          <p className="text-sm text-slate-700 whitespace-pre-line">{job.description}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No specifications provided.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 px-4 py-3 sm:px-6 flex flex-row-reverse justify-between items-center">
                <div className="flex space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        Edit Details
                      </button>
                    </>
                  )}
                </div>
                
                {!isEditing && job.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Completed')}
                    className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Mark as Completed
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

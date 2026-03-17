import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import clsx from 'clsx';
import JobDetailModal from './JobDetailModal';

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

const STATUSES = ['Pending', 'In Production', 'Finishing', 'Ready for Pickup', 'Completed'];

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openJobModal = (id: number) => {
    setSelectedJobId(id);
    setIsModalOpen(true);
  };

  const updateJobStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchJobs(); // Refresh board
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Group jobs by status
  const groupedJobs = STATUSES.reduce((acc, status) => {
    acc[status] = jobs.filter(job => job.status === status);
    return acc;
  }, {} as Record<string, Job[]>);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Production Board</h1>
          <p className="text-sm text-slate-500 mt-1">Track active print jobs across all workflow stages.</p>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading production board...</div>
        ) : (
          <div className="flex gap-6 min-w-max h-full items-start">
            {STATUSES.map(status => (
              <div key={status} className="w-80 flex flex-col bg-slate-100 rounded-xl border border-slate-200 shadow-sm max-h-full">
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                  <h3 className="font-semibold text-slate-800 flex items-center">
                    {status === 'Completed' && <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />}
                    {status}
                  </h3>
                  <span className="bg-white text-slate-600 py-0.5 px-2.5 rounded-full text-xs font-medium border border-slate-200 shadow-sm">
                    {groupedJobs[status].length}
                  </span>
                </div>

                {/* Column Content */}
                <div className="p-3 overflow-y-auto flex-1 space-y-3 min-h-[150px]">
                  {groupedJobs[status].length === 0 ? (
                    <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                      No jobs
                    </div>
                  ) : (
                    groupedJobs[status].map(job => {
                      const dueDate = new Date(job.due_date);
                      const isUrgent = isPast(dueDate) || isToday(dueDate);
                      
                      return (
                        <div 
                          key={job.id} 
                          className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => openJobModal(job.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {job.title}
                            </h4>
                          </div>
                          
                          <p className="text-xs text-slate-500 mb-3 line-clamp-1">
                            {job.client_name} {job.company_name ? `(${job.company_name})` : ''}
                          </p>

                          <div className="flex items-center justify-between mt-4">
                            <div className={clsx(
                              "flex items-center text-xs font-medium px-2 py-1 rounded-md",
                              job.status === 'Completed' ? "bg-emerald-50 text-emerald-700" :
                              isUrgent ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"
                            )}>
                              {isUrgent && job.status !== 'Completed' ? (
                                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                              ) : (
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              {format(dueDate, 'MMM d')}
                            </div>
                            
                            {/* Quick Action Button */}
                            {status === 'Pending' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateJobStatus(job.id, 'In Production'); }}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {status === 'Ready for Pickup' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateJobStatus(job.id, 'Completed'); }}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJobId && (
        <JobDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          jobId={selectedJobId}
          onSuccess={fetchJobs}
        />
      )}
    </div>
  );
}

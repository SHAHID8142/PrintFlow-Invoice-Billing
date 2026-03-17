import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Briefcase, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface ActivityItem {
  id: number;
  type: 'invoice' | 'job' | 'expense';
  reference: string;
  status: string | null;
  amount: number | null;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading: boolean;
}

export default function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading recent activity...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
        <p className="text-sm text-slate-500">No recent activity found.</p>
      </div>
    );
  }

  const getIcon = (type: string, status: string | null) => {
    switch (type) {
      case 'invoice':
        if (status === 'Paid') return <CheckCircle className="h-5 w-5 text-emerald-500" />;
        if (status === 'Overdue') return <AlertCircle className="h-5 w-5 text-rose-500" />;
        return <FileText className="h-5 w-5 text-indigo-500" />;
      case 'job':
        if (status === 'Completed') return <CheckCircle className="h-5 w-5 text-emerald-500" />;
        return <Briefcase className="h-5 w-5 text-amber-500" />;
      case 'expense':
        return <DollarSign className="h-5 w-5 text-rose-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getMessage = (item: ActivityItem) => {
    switch (item.type) {
      case 'invoice':
        return (
          <>
            Invoice <span className="font-medium text-slate-900">{item.reference}</span> marked as{' '}
            <span className={clsx(
              "font-medium",
              item.status === 'Paid' ? 'text-emerald-600' : 
              item.status === 'Overdue' ? 'text-rose-600' : 'text-slate-600'
            )}>{item.status}</span>
            {item.amount && ` ($${item.amount.toFixed(2)})`}
          </>
        );
      case 'job':
        return (
          <>
            Job <span className="font-medium text-slate-900">"{item.reference}"</span> updated to{' '}
            <span className={clsx(
              "font-medium",
              item.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
            )}>{item.status}</span>
          </>
        );
      case 'expense':
        return (
          <>
            Expense logged for <span className="font-medium text-slate-900">{item.reference}</span>
            {item.amount && ` ($${item.amount.toFixed(2)})`}
          </>
        );
      default:
        return 'Unknown activity';
    }
  };

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={`${activity.type}-${activity.id}`}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={clsx(
                    "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
                    activity.type === 'invoice' ? 'bg-indigo-50' :
                    activity.type === 'job' ? 'bg-amber-50' : 'bg-rose-50'
                  )}>
                    {getIcon(activity.type, activity.status)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {getMessage(activity)}
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-slate-500">
                    <time dateTime={activity.timestamp}>
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

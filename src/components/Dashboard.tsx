import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, DollarSign, TrendingUp, TrendingDown, Briefcase, AlertCircle } from 'lucide-react';
import KpiCard from './KpiCard';
import ActivityFeed from './ActivityFeed';

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    outstanding_dues: 0,
    expenses: 0,
    net_profit: 0,
    active_jobs: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = format(new Date(), 'MMMM yyyy');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Use Promise.all to fetch both endpoints concurrently, avoiding waterfall delays
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity')
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (activityRes.ok) {
          setActivities(await activityRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExport = () => {
    // Placeholder for local file-system export
    alert('Exporting Monthly Report (CSV)... This will trigger a file save dialog in the desktop app.');
  };

  // Calculate percentages for the visual bar
  const totalFinancials = stats.revenue + stats.expenses;
  const revenuePercent = totalFinancials > 0 ? (stats.revenue / totalFinancials) * 100 : 50;
  const expensesPercent = totalFinancials > 0 ? (stats.expenses / totalFinancials) * 100 : 50;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening in your shop for {currentMonth}.</p>
        </div>
        
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Monthly Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard
          title="Total Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          icon={TrendingUp}
          colorClass="text-emerald-600 bg-emerald-50"
          subtitle="Paid invoices"
        />
        <KpiCard
          title="Outstanding Dues"
          value={`$${stats.outstanding_dues.toFixed(2)}`}
          icon={AlertCircle}
          colorClass="text-amber-600 bg-amber-50"
          subtitle="Unpaid/Partial"
        />
        <KpiCard
          title="Total Expenses"
          value={`$${stats.expenses.toFixed(2)}`}
          icon={TrendingDown}
          colorClass="text-rose-600 bg-rose-50"
          subtitle="Logged expenses"
        />
        <KpiCard
          title="Net Profit"
          value={`$${Math.abs(stats.net_profit).toFixed(2)}`}
          icon={DollarSign}
          colorClass={stats.net_profit >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}
          subtitle={stats.net_profit >= 0 ? "Profit" : "Loss"}
        />
        <KpiCard
          title="Active Print Jobs"
          value={stats.active_jobs}
          icon={Briefcase}
          colorClass="text-indigo-600 bg-indigo-50"
          subtitle="In progress"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Data Representation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Revenue vs. Expenses</h3>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">${stats.revenue.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500">Expenses</p>
                  <p className="text-2xl font-bold text-rose-600">${stats.expenses.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Stacked Progress Bar */}
              <div className="relative w-full h-8 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${revenuePercent}%` }}
                ></div>
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${expensesPercent}%` }}
                ></div>
              </div>
              
              <div className="mt-4 flex justify-between text-sm text-slate-500">
                <span>{revenuePercent.toFixed(1)}%</span>
                <span>{expensesPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Recent Activity</h3>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
              <ActivityFeed activities={activities} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  colorClass?: string;
}

export default function KpiCard({ title, value, icon: Icon, trend, subtitle, colorClass = 'text-indigo-600 bg-indigo-50' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className={clsx("p-2 rounded-lg", colorClass.split(' ')[1])}>
          <Icon className={clsx("h-5 w-5", colorClass.split(' ')[0])} />
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        
        {(trend || subtitle) && (
          <div className="mt-2 flex items-center text-sm">
            {trend && (
              <span className={clsx("font-medium mr-2", trend.isPositive ? "text-emerald-600" : "text-rose-600")}>
                {trend.isPositive ? '+' : '-'}{trend.value}
              </span>
            )}
            {subtitle && <span className="text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

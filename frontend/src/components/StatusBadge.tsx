import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';

  switch (normalized) {
    case 'ACTIVE':
    case 'PAID':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500/20';
      break;
    case 'CONFIRMED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-500/20';
      break;
    case 'QUOTATION':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-500/20';
      break;
    case 'DRAFT':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-500/20';
      break;
    case 'PAUSED':
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-300 ring-1 ring-orange-500/20';
      break;
    case 'OVERDUE':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-500/30 font-semibold';
      break;
    case 'CLOSED':
    case 'CANCELLED':
      colorClasses = 'bg-gray-100 text-gray-600 border-gray-300';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {normalized}
    </span>
  );
};

import React from 'react';

const STATUS_CONFIGS = {
  // Employee statuses
  ACTIVE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
  PROBATION: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Probation' },
  NOTICE_PERIOD: { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Notice Period' },
  EXITED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Exited' },
  ON_LEAVE: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'On Leave' },

  // Payroll run statuses
  DRAFT: { bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400', label: 'Draft' },
  MANAGER_REVIEWED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Manager Reviewed' },
  APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Approved' },
  LOCKED: { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', label: 'Locked' },

  // Approval statuses (Leave / Loan / Claims)
  PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
  REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
  SUBMITTED: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', label: 'Submitted' },
  VERIFIED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Verified' },
  DISBURSED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Disbursed' },
  CLOSED: { bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400', label: 'Closed' }
};

export default function StatusBadge({ status, customLabel, size = 'sm', showDot = true }) {
  const normalized = (status || '').toUpperCase().trim();
  const config = STATUS_CONFIGS[normalized] || {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
    label: status || 'Unknown'
  };

  const label = customLabel || config.label;
  const padding = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bg} ${padding}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {label}
    </span>
  );
}

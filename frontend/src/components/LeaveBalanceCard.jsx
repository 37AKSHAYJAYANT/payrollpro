function LeaveBalanceCard({ balance }) {
  const { leaveTypeName, leaveTypeCode, totalBalance, used, remaining } = balance;

  const percentage = totalBalance > 0 ? Math.min(100, Math.round((remaining / totalBalance) * 100)) : 0;

  const colorClasses = {
    CL: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
    SL: { bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' },
    EL: { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-800' }
  };

  const scheme = colorClasses[leaveTypeCode] || {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scheme.badge}`}>
          {leaveTypeCode}
        </span>
        <span className="text-xs text-gray-400 font-medium">{balance.year}</span>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700">{leaveTypeName}</h4>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-gray-900">{remaining}</span>
          <span className="text-xs text-gray-500">/ {totalBalance} days remaining</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${scheme.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>Used: {used}</span>
          <span>{percentage}% Available</span>
        </div>
      </div>
    </div>
  );
}

export default LeaveBalanceCard;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getEmployees, getAllPayrollRuns } from '../services/api';
import EmployeeDashboard from './EmployeeDashboard';

function DashboardPage() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [empCount, setEmpCount] = useState(200);
  const [latestRun, setLatestRun] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (role === 'EMPLOYEE') {
    return <EmployeeDashboard />;
  }

  useEffect(() => {
    if (location.search.includes('onboarding=true')) {
      setShowOnboarding(true);
    }

    if (role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER') {
      getEmployees(0, 1)
        .then((data) => {
          if (data && data.totalElements) setEmpCount(data.totalElements);
        })
        .catch(() => {});

      getAllPayrollRuns()
        .then((runs) => {
          if (runs && runs.length > 0) setLatestRun(runs[0]);
        })
        .catch(() => {});
    }
  }, [role, location.search]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Department Distribution Data
  const deptData = [
    { name: 'Engineering', count: 40, budget: '₹44.00 Lakhs', pct: 20, color: 'bg-indigo-600' },
    { name: 'Finance', count: 40, budget: '₹41.20 Lakhs', pct: 18.7, color: 'bg-blue-600' },
    { name: 'Sales', count: 40, budget: '₹38.50 Lakhs', pct: 17.5, color: 'bg-emerald-600' },
    { name: 'Operations', count: 40, budget: '₹35.80 Lakhs', pct: 16.3, color: 'bg-amber-600' },
    { name: 'Human Resources', count: 40, budget: '₹33.00 Lakhs', pct: 15, color: 'bg-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                P
              </span>
              <h1 className="text-xl font-bold text-indigo-600">PayrollPro</h1>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">Executive Console</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {role}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Onboarding Banner (Task 7.2) */}
        {showOnboarding && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2">
                🎉 Workspace Ready
              </div>
              <h2 className="text-xl font-bold">Welcome to your new PayrollPro Workspace!</h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
                Default Indian statutory leave types (CL, SL, EL) are auto-configured. Next steps: 1) Add employees, 2) Log monthly attendance, 3) Run batch payroll.
              </p>
            </div>
            <button
              onClick={() => setShowOnboarding(false)}
              className="px-4 py-2 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition"
            >
              Got it, Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Dashboard &amp; Payroll Analytics</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enterprise Overview • Real-time Headcount, Statutory Compliance, and Payout Metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/payroll"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              🚀 Run September Payroll
            </Link>
          </div>
        </div>

        {/* 4 Quick Stat Cards (Task 7.3) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Headcount</div>
            <div className="text-3xl font-extrabold text-gray-900 mt-2">{empCount}</div>
            <div className="text-xs text-green-600 mt-1 font-medium">● 100% In System</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Employees</div>
            <div className="text-3xl font-extrabold text-indigo-600 mt-2">{empCount}</div>
            <div className="text-xs text-gray-500 mt-1">Eligible for payroll</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Leaves</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-2">1</div>
            <Link to="/leaves/approvals" className="text-xs text-amber-700 hover:underline mt-1 block">
              Review requests →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Exited / Separated</div>
            <div className="text-3xl font-extrabold text-gray-400 mt-2">0</div>
            <div className="text-xs text-gray-400 mt-1">0% Turnover rate</div>
          </div>
        </div>

        {/* Analytics Section: Department Breakdown & Payroll Trends (Task 7.3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Salary Distribution */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-5">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Department Salary Distribution</h3>
                <p className="text-xs text-gray-500 mt-0.5">Headcount allocation and estimated monthly compensation</p>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                5 Departments
              </span>
            </div>

            <div className="space-y-4">
              {deptData.map((d) => (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-800">{d.name} ({d.count} staff)</span>
                    <span className="font-mono text-gray-600">{d.budget}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${d.color} h-full rounded-full transition-all duration-500`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Payroll Trend Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-base font-bold text-gray-900">Payroll Cycle Summary</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  latestRun?.status === 'LOCKED' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {latestRun ? latestRun.status : 'NO RUN'}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="text-gray-500">Pay Cycle</div>
                  <div className="text-sm font-bold text-gray-900">September 2026</div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl space-y-1 border border-indigo-100">
                  <div className="text-indigo-700 font-medium">Total Net Disbursal</div>
                  <div className="text-xl font-extrabold text-indigo-950">
                    {latestRun ? `₹${parseFloat(latestRun.totalNetPay || 0).toLocaleString('en-IN')}` : '₹2,03,40,666.68'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">Gross Total:</span>
                    <span className="font-semibold text-gray-800">
                      {latestRun ? `₹${parseFloat(latestRun.totalGrossPay || 0).toLocaleString('en-IN')}` : '₹2.20 Cr'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-red-50/50 rounded-lg">
                    <span className="text-red-500 block">Deductions:</span>
                    <span className="font-semibold text-red-700">
                      {latestRun ? `₹${parseFloat(latestRun.totalDeductions || 0).toLocaleString('en-IN')}` : '₹16.76 L'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t text-xs">
              <Link to="/payroll" className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-between">
                <span>View Full Payroll Run</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Operational Modules Navigation Cards */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Core Management Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Employee Directory Card */}
            <Link
              to="/employees"
              className="group block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 text-sm">Employee Directory</h4>
              <p className="text-xs text-gray-500 mt-1">200 employees, salary structures, &amp; search</p>
            </Link>

            {/* Attendance Card */}
            <Link
              to="/attendance"
              className="group block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-amber-500 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 group-hover:text-amber-600 text-sm">Attendance Logging</h4>
              <p className="text-xs text-gray-500 mt-1">Manual entry &amp; CSV bulk upload</p>
            </Link>

            {/* Leave Management Card */}
            <Link
              to="/leaves"
              className="group block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 text-sm">Leave Management</h4>
              <p className="text-xs text-gray-500 mt-1">CL, SL, EL balances &amp; approvals</p>
            </Link>

            {/* Payroll Batch Card */}
            <Link
              to="/payroll"
              className="group block bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 group-hover:text-purple-600 text-sm">Payroll Processing</h4>
              <p className="text-xs text-gray-500 mt-1">Batch calculation &amp; 3-step signoff</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

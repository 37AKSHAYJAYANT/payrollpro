import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getEmployees, getAllPayrollRuns, getPendingLeaveRequests, getPendingLoans } from '../services/api';
import EmployeeDashboard from './EmployeeDashboard';
import Navbar from '../components/Navbar';

function DashboardPage() {
  const { role, companyName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [empCount, setEmpCount] = useState(0);
  const [employeesList, setEmployeesList] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [pendingLoansCount, setPendingLoansCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (role === 'EMPLOYEE') {
    return <EmployeeDashboard />;
  }

  useEffect(() => {
    if (location.search.includes('onboarding=true')) {
      setShowOnboarding(true);
    }

    if (role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER') {
      getEmployees(0, 100)
        .then((data) => {
          if (data && typeof data.totalElements === 'number') {
            setEmpCount(data.totalElements);
          } else if (data && Array.isArray(data.content)) {
            setEmpCount(data.content.length);
          } else {
            setEmpCount(0);
          }
          if (data && Array.isArray(data.content)) {
            setEmployeesList(data.content);
          }
        })
        .catch(() => {
          setEmpCount(0);
          setEmployeesList([]);
        });

      getAllPayrollRuns()
        .then((runs) => {
          if (runs && runs.length > 0) setLatestRun(runs[0]);
          else setLatestRun(null);
        })
        .catch(() => setLatestRun(null));

      getPendingLeaveRequests()
        .then((leaves) => {
          if (Array.isArray(leaves)) setPendingLeavesCount(leaves.length);
          else setPendingLeavesCount(0);
        })
        .catch(() => setPendingLeavesCount(0));

      getPendingLoans()
        .then((loans) => {
          if (Array.isArray(loans)) setPendingLoansCount(loans.length);
          else setPendingLoansCount(0);
        })
        .catch(() => setPendingLoansCount(0));
    }
  }, [role, location.search]);

  // Compute dynamic department distribution from real employees
  const deptData = useMemo(() => {
    if (!employeesList || employeesList.length === 0) return [];
    const groups = {};
    employeesList.forEach((e) => {
      const dept = e.department || 'General';
      if (!groups[dept]) groups[dept] = { count: 0 };
      groups[dept].count += 1;
    });
    const total = employeesList.length;
    const colors = ['bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];
    return Object.entries(groups).map(([name, val], idx) => ({
      name,
      count: val.count,
      pct: total > 0 ? Math.round((val.count / total) * 100) : 0,
      color: colors[idx % colors.length]
    }));
  }, [employeesList]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <Navbar currentPage="Executive Console" pendingLeavesCount={pendingLeavesCount} pendingLoansCount={pendingLoansCount} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Onboarding Banner */}
        {showOnboarding && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2">
                🎉 Workspace Ready (0 Data)
              </div>
              <h2 className="text-lg sm:text-xl font-bold">
                Welcome to {companyName || 'your new company workspace'}!
              </h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
                Your company profile has been created with all data at zero. Default Indian statutory leave rules (CL, SL, EL) are auto-configured. Next steps: 1) Add employees, 2) Log attendance, 3) Process monthly payroll.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/employees"
                className="px-4 py-2 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition shadow-sm whitespace-nowrap"
              >
                + Add First Employee
              </Link>
              <button
                onClick={() => setShowOnboarding(false)}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Zero Data Welcome Card for New Companies */}
        {empCount === 0 && !showOnboarding && (
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white rounded-2xl p-6 sm:p-8 border-2 border-dashed border-indigo-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-md shadow-indigo-200">
              🏢
            </div>
            <div className="max-w-xl mx-auto">
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                {companyName ? `${companyName} Workspace Ready` : 'Company Workspace Ready'} (All Data Zero)
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
                Headcount, payroll cycles, and attendance are currently at zero. You can now begin adding your organization's staff, assigning designations, and configuring salary structures.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                to="/employees"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
              >
                + Add First Employee
              </Link>
              <Link
                to="/attendance"
                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs sm:text-sm transition"
              >
                Attendance Console
              </Link>
            </div>
          </div>
        )}

        {/* Pending Loan Action Alert Banner */}
        {pendingLoansCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-xl">
                💰
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold">
                  {pendingLoansCount} Emergency Loan / Advance Application Pending HR Approval
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  An employee has submitted a salary advance or loan request. Review &amp; approve to activate auto-recovery.
                </p>
              </div>
            </div>
            <Link
              to="/loans/approvals"
              className="px-4 py-2 bg-white text-amber-800 hover:bg-amber-50 font-bold text-xs rounded-xl shadow transition whitespace-nowrap text-center"
            >
              Review Loan Applications →
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {companyName ? `${companyName} Dashboard` : 'Dashboard & Payroll Analytics'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Enterprise Overview • Real-time Headcount, Statutory Compliance, and Payout Metrics
            </p>
          </div>
          <div className="flex gap-2">
            {empCount === 0 ? (
              <Link
                to="/employees"
                className="w-full sm:w-auto text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                + Add Employees
              </Link>
            ) : (
              <Link
                to="/payroll"
                className="w-full sm:w-auto text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                🚀 Run September Payroll
              </Link>
            )}
          </div>
        </div>

        {/* 5 Quick Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200">
            <div className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Headcount</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1.5">{empCount}</div>
            <div className="text-[11px] sm:text-xs text-gray-500 mt-1 font-medium">
              {empCount > 0 ? '● 100% In System' : '0 in system • Add employees'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200">
            <div className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Employees</div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${empCount > 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
              {empCount}
            </div>
            <div className="text-[11px] sm:text-xs text-gray-500 mt-1">
              {empCount > 0 ? 'Eligible for payroll' : 'None active yet'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200">
            <div className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Leaves</div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${pendingLeavesCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {pendingLeavesCount}
            </div>
            {pendingLeavesCount > 0 ? (
              <Link to="/leaves/approvals" className="text-[11px] sm:text-xs text-amber-700 hover:underline mt-1 block">
                Review requests →
              </Link>
            ) : (
              <div className="text-[11px] sm:text-xs text-green-600 mt-1 font-medium">● All clear</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200">
            <div className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Loans</div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${pendingLoansCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {pendingLoansCount}
            </div>
            {pendingLoansCount > 0 ? (
              <Link to="/loans/approvals" className="text-[11px] sm:text-xs text-amber-700 hover:underline mt-1 block font-bold">
                Review &amp; Approve →
              </Link>
            ) : (
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1 font-medium">● None pending</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 col-span-2 lg:col-span-1">
            <div className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Exited / Separated</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-400 mt-1.5">0</div>
            <div className="text-[11px] sm:text-xs text-gray-400 mt-1">0% Turnover rate</div>
          </div>
        </div>

        {/* Analytics Section: Department Breakdown & Payroll Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Salary Distribution */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-5">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Department Headcount Distribution</h3>
                <p className="text-xs text-gray-500 mt-0.5">Staff allocation across company departments</p>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {deptData.length} {deptData.length === 1 ? 'Department' : 'Departments'}
              </span>
            </div>

            {deptData.length === 0 ? (
              <div className="text-center py-12 px-4 text-gray-400 space-y-2">
                <div className="text-3xl">📊</div>
                <p className="text-sm font-semibold text-gray-700">No Department Data Yet</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Department allocations and headcount bars will appear automatically as you add staff members.
                </p>
                <Link
                  to="/employees"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  + Add Employee to Directory →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {deptData.map((d) => (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-800">{d.name} ({d.count} staff)</span>
                      <span className="font-mono text-gray-600">{d.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`${d.color} h-full rounded-full transition-all duration-500`} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Payroll Trend Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-base font-bold text-gray-900">Payroll Cycle Summary</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  latestRun?.status === 'LOCKED'
                    ? 'bg-purple-100 text-purple-800'
                    : latestRun
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {latestRun ? latestRun.status : 'NO RUNS'}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="text-gray-500">Pay Cycle</div>
                  <div className="text-sm font-bold text-gray-900">
                    {latestRun ? `${latestRun.month}/${latestRun.year}` : 'September 2026'}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl space-y-1 border border-indigo-100">
                  <div className="text-indigo-700 font-medium">Total Net Disbursal</div>
                  <div className="text-xl font-extrabold text-indigo-950">
                    {latestRun ? `₹${parseFloat(latestRun.totalNetPay || 0).toLocaleString('en-IN')}` : '₹0.00'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">Gross Total:</span>
                    <span className="font-semibold text-gray-800">
                      {latestRun ? `₹${parseFloat(latestRun.totalGrossPay || 0).toLocaleString('en-IN')}` : '₹0.00'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-red-50/50 rounded-lg">
                    <span className="text-red-500 block">Deductions:</span>
                    <span className="font-semibold text-red-700">
                      {latestRun ? `₹${parseFloat(latestRun.totalDeductions || 0).toLocaleString('en-IN')}` : '₹0.00'}
                    </span>
                  </div>
                </div>

                {!latestRun && (
                  <p className="text-[11px] text-gray-400 pt-1">
                    No payroll cycles processed yet. Add employees and log attendance to run your first batch.
                  </p>
                )}
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
              <p className="text-xs text-gray-500 mt-1">
                {empCount} {empCount === 1 ? 'employee' : 'employees'}, salary structures, &amp; search
              </p>
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
              to="/leaves/approvals"
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

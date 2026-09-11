import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser, getMyPayslips, downloadPayslipPdf, getMyLeaveBalances } from '../services/api';

function EmployeeDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const [profileData, payslipsData, balancesData] = await Promise.all([
          getCurrentUser().catch(() => null),
          getMyPayslips().catch(() => []),
          getMyLeaveBalances().catch(() => [])
        ]);

        setProfile(profileData);
        setPayslips(payslipsData || []);
        setBalances(balancesData || []);
      } catch (err) {
        setError(err.message || 'Failed to load employee dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleDownloadPdf(record) {
    try {
      setDownloadingId(record.id);
      await downloadPayslipPdf(record.id, `Payslip-${record.payslipRef || record.id}.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download payslip');
    } finally {
      setDownloadingId(null);
    }
  }

  const latestPayslip = payslips && payslips.length > 0 ? payslips[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Employee Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  P
                </span>
                <span className="text-xl font-bold text-gray-900">PayrollPro</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  Self-Service Portal
                </span>
              </div>

              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/employee/payslips"
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  My Payslips
                </Link>
                <Link
                  to="/leaves"
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Leave Management
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">
                  {profile?.fullName || 'Employee'}
                </div>
                <div className="text-xs text-gray-500">
                  {profile?.empCode || ''} • {profile?.department || 'Employee'}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur-sm border border-white/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Active Employee Profile
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Welcome back, {profile?.fullName || 'Colleague'}!
              </h1>
              <p className="text-indigo-200 text-sm mt-1 max-w-xl">
                {profile?.designation || 'Staff'} • {profile?.department || 'General'} at {profile?.companyName || 'PayrollPro SaaS'}
              </p>
            </div>

            {latestPayslip && (
              <button
                onClick={() => handleDownloadPdf(latestPayslip)}
                disabled={downloadingId === latestPayslip.id}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-900 font-bold text-sm shadow-lg hover:bg-indigo-50 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {downloadingId === latestPayslip.id ? 'Generating PDF...' : 'Download Latest Payslip'}
              </button>
            )}
          </div>
        </div>

        {/* 3 Overview Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Latest Salary Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <span>Latest Net Payout</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold">
                  Credited
                </span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {latestPayslip ? `₹${parseFloat(latestPayslip.netPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {latestPayslip ? `Period: ${latestPayslip.month}/${latestPayslip.year} • Ref: ${latestPayslip.payslipRef}` : 'No recent payroll run found'}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Gross: ₹{parseFloat(latestPayslip?.grossEarned || 0).toLocaleString('en-IN')}</span>
              <Link to="/employee/payslips" className="text-indigo-600 font-semibold hover:underline">
                View All Payslips →
              </Link>
            </div>
          </div>

          {/* Leave Balances Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <span>Leave Balances</span>
                <Link to="/leaves" className="text-indigo-600 lowercase font-medium hover:underline text-xs">
                  request leave
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {balances && balances.length > 0 ? (
                  balances.map((b) => (
                    <div key={b.leaveTypeCode || b.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-xs font-bold text-gray-600">{b.leaveTypeCode || 'Leave'}</div>
                      <div className="text-xl font-extrabold text-indigo-600 mt-1">
                        {parseFloat(b.remainingDays || 0).toFixed(1)}
                      </div>
                      <div className="text-[10px] text-gray-400">Available</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-xs text-gray-400 py-3">
                    Balances: CL (12), SL (6), EL (15)
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-right text-xs">
              <Link to="/leaves" className="text-emerald-600 font-semibold hover:underline">
                Apply for New Leave →
              </Link>
            </div>
          </div>

          {/* Profile & Statutory Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Profile &amp; Bank Details
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Employee Code:</span>
                  <span className="font-semibold text-gray-900">{profile?.empCode || 'EMP-001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Work Email:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[180px]">{profile?.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-semibold text-gray-900">{profile?.department || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Company:</span>
                  <span className="font-semibold text-gray-900">{profile?.companyName || 'Demo Company Inc.'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
              Tax status: Standard Regime
            </div>
          </div>
        </div>

        {/* Payslips Archive Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Payslip Records</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Official server-generated tax and salary statements available for instant PDF download.
              </p>
            </div>
            <Link
              to="/employee/payslips"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View Full History →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading your payslip history...</div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">
              No payslip records generated yet. Once HR executes payroll, your statements will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Pay Period</th>
                    <th className="px-6 py-3 font-semibold">Reference #</th>
                    <th className="px-6 py-3 font-semibold text-right">Payable Days</th>
                    <th className="px-6 py-3 font-semibold text-right">Gross Earned</th>
                    <th className="px-6 py-3 font-semibold text-right">Deductions</th>
                    <th className="px-6 py-3 font-semibold text-right">Net Payable</th>
                    <th className="px-6 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payslips.slice(0, 5).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {record.month}/{record.year}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {record.payslipRef}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {record.payableDays} / {record.totalWorkingDays}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        ₹{parseFloat(record.grossEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">
                        ₹{parseFloat(record.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-indigo-700">
                        ₹{parseFloat(record.netPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDownloadPdf(record)}
                          disabled={downloadingId === record.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {downloadingId === record.id ? 'Downloading...' : 'PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default EmployeeDashboard;

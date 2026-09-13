import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCurrentUser,
  getMyPayslips,
  downloadPayslipPdf,
  getMyLeaveBalances,
  getMyLoans,
  applyForLoan,
  getMyTaxDeclaration,
  submitMyTaxDeclaration,
  getMyExpenseClaims,
  submitExpenseClaim
} from '../services/api';

function EmployeeDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loans, setLoans] = useState([]);
  const [expenseClaims, setExpenseClaims] = useState([]);
  const [taxDecl, setTaxDecl] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({ principalAmount: '', tenureMonths: 6, reason: '' });
  const [loanSubmitting, setLoanSubmitting] = useState(false);

  // Expense claim modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'TRAVEL',
    amount: '',
    merchant: '',
    claimDate: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: ''
  });
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // Tax declaration modal state
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxForm, setTaxForm] = useState({
    financialYear: '2026-2027',
    regime: 'NEW_REGIME',
    section80C: '',
    section80D: '',
    section24HomeLoan: '',
    annualRentPaid: '',
    isMetro: true,
    otherExemptions: ''
  });
  const [taxSubmitting, setTaxSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const [profileData, payslipsData, balancesData, loansData, taxData, expenseData] = await Promise.all([
          getCurrentUser().catch(() => null),
          getMyPayslips().catch(() => []),
          getMyLeaveBalances().catch(() => []),
          getMyLoans().catch(() => []),
          getMyTaxDeclaration('2026-2027').catch(() => null),
          getMyExpenseClaims().catch(() => [])
        ]);

        setProfile(profileData);
        setPayslips(payslipsData || []);
        setBalances(balancesData || []);
        setLoans(loansData || []);
        setExpenseClaims(expenseData || []);
        if (taxData) {
          setTaxDecl(taxData);
          setTaxForm({
            financialYear: taxData.financialYear || '2026-2027',
            regime: taxData.regime || 'NEW_REGIME',
            section80C: taxData.section80C != null ? taxData.section80C : '',
            section80D: taxData.section80D != null ? taxData.section80D : '',
            section24HomeLoan: taxData.section24HomeLoan != null ? taxData.section24HomeLoan : '',
            annualRentPaid: taxData.annualRentPaid != null ? taxData.annualRentPaid : '',
            isMetro: taxData.isMetro !== false,
            otherExemptions: taxData.otherExemptions != null ? taxData.otherExemptions : ''
          });
        }
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
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  P
                </span>
                <span className="text-lg sm:text-xl font-bold text-gray-900">PayrollPro</span>
                <span className="hidden sm:inline text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
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

            <div className="flex items-center space-x-2 sm:space-x-4">
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
                className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
        <Link
          to="/dashboard"
          className="px-3 py-1.5 font-medium rounded-lg text-indigo-700 bg-indigo-50 whitespace-nowrap shrink-0"
        >
          Dashboard
        </Link>
        <Link
          to="/employee/payslips"
          className="px-3 py-1.5 font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 whitespace-nowrap shrink-0"
        >
          My Payslips
        </Link>
        <Link
          to="/leaves"
          className="px-3 py-1.5 font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 whitespace-nowrap shrink-0"
        >
          Leave Management
        </Link>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur-sm border border-white/20 mb-2 sm:mb-3">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Active Employee Profile
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {profile?.fullName || 'Colleague'}!
              </h1>
              <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl">
                {profile?.designation || 'Staff'} • {profile?.department || 'General'} at {profile?.companyName || 'PayrollPro SaaS'}
              </p>
            </div>

            {latestPayslip && (
              <button
                onClick={() => handleDownloadPdf(latestPayslip)}
                disabled={downloadingId === latestPayslip.id}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white text-indigo-900 font-bold text-xs sm:text-sm shadow-lg hover:bg-indigo-50 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 w-full sm:w-auto"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {downloadingId === latestPayslip.id ? 'Generating PDF...' : 'Download Latest Payslip'}
              </button>
            )}
          </div>
        </div>

        {/* 3 Overview Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
                <Link to="/leaves" className="text-indigo-600 font-semibold hover:underline text-xs">
                  Request Leave &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                {balances && balances.length > 0 ? (
                  balances.map((b) => {
                    const remainingVal = Number(b.remaining != null ? b.remaining : (b.remainingDays != null ? b.remainingDays : 0));
                    const totalVal = Number(b.totalBalance != null ? b.totalBalance : 0);
                    const usedVal = Number(b.used != null ? b.used : 0);
                    const pendingVal = Number(b.pendingDays || 0);

                    const badgeColors = {
                      CL: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      SL: 'bg-rose-50 text-rose-800 border-rose-200',
                      EL: 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    };
                    const colorStyle = badgeColors[b.leaveTypeCode] || 'bg-gray-50 text-gray-800 border-gray-200';

                    return (
                      <div key={b.leaveTypeCode || b.id} className={`p-3 rounded-xl border ${colorStyle} flex flex-col justify-between transition hover:shadow-xs`}>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide">{b.leaveTypeCode || 'Leave'}</div>
                          <div className="text-2xl font-black text-gray-900 mt-1">
                            {remainingVal.toFixed(1)}
                          </div>
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            Days Left
                          </div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-gray-200/60 text-[10px] text-gray-500 space-y-0.5">
                          <div><span className="font-semibold text-gray-700">{usedVal}</span> of {totalVal} used</div>
                          {pendingVal > 0 && (
                            <div className="text-amber-600 font-medium">({pendingVal} pending)</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-6 text-xs text-gray-400">
                    Loading leave allocations...
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-400">Annual Quota Year: {new Date().getFullYear()}</span>
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

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Regime: <span className="font-semibold text-gray-800">{taxDecl?.regime === 'OLD_REGIME' ? 'Old Regime (Sec 80C/80D)' : 'New Regime (Sec 115BAC)'}</span>
              </span>
              <button
                onClick={() => setShowTaxModal(true)}
                className="text-indigo-600 font-bold hover:underline"
              >
                {taxDecl?.status ? `Form 12BB (${taxDecl.status}) →` : 'Declare Taxes (Form 12BB) →'}
              </button>
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
        {/* Loans & Salary Advances Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Emergency Loans & Salary Advances</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Zero Hassle Auto-EMI
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Apply for corporate salary advances or emergency loans with automatic monthly payroll EMI deductions.
              </p>
            </div>
            <button
              onClick={() => setShowLoanModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Apply for Loan / Advance
            </button>
          </div>

          {successMsg && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex justify-between items-center">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold hover:text-emerald-900">×</button>
            </div>
          )}

          {loans.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No loan or salary advance applications on file. Need emergency funds? Click "Apply for Loan / Advance" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Principal</th>
                    <th className="px-6 py-3 font-semibold">Monthly EMI</th>
                    <th className="px-6 py-3 font-semibold">Tenure</th>
                    <th className="px-6 py-3 font-semibold">Remaining Balance</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {loans.map((ln) => (
                    <tr key={ln.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{parseFloat(ln.principalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-700">
                        ₹{parseFloat(ln.monthlyEmi || 0).toLocaleString('en-IN')} / mo
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {ln.tenureMonths} Months
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        ₹{parseFloat(ln.remainingPrincipal ?? ln.remainingBalance ?? ln.principalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ln.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          ln.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          ln.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ln.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {ln.reason || 'Personal / Emergency'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expense Claims & Reimbursements Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Expense Claims & Reimbursements</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Tax-Free Payouts
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Submit corporate business travel, meals, broadband, or fuel expenses. Approved claims are paid directly with monthly payroll.
              </p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Submit Expense Claim
            </button>
          </div>

          {expenseClaims.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No expense reimbursement claims submitted. Click "+ Submit Expense Claim" to submit bills or receipts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Merchant</th>
                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenseClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-mono text-xs text-gray-700">
                        {claim.claimDate || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">
                          {claim.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {claim.merchant || '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-gray-900">
                        ₹{parseFloat(claim.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          claim.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          claim.status === 'DISBURSED' ? 'bg-purple-100 text-purple-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate text-xs">
                        {claim.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Loan Application Modal */}
        {showLoanModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Apply for Loan / Salary Advance</h3>
                  <p className="text-xs text-gray-500">Auto-deducted via upcoming payroll runs</p>
                </div>
                <button
                  onClick={() => setShowLoanModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!loanForm.principalAmount || Number(loanForm.principalAmount) <= 0) {
                    alert('Please enter a valid principal amount.');
                    return;
                  }
                  try {
                    setLoanSubmitting(true);
                    const res = await applyForLoan({
                      principalAmount: parseFloat(loanForm.principalAmount),
                      tenureMonths: parseInt(loanForm.tenureMonths, 10),
                      reason: loanForm.reason
                    });
                    setLoans([res, ...loans]);
                    setShowLoanModal(false);
                    setLoanForm({ principalAmount: '', tenureMonths: 6, reason: '' });
                    setSuccessMsg('Loan application submitted successfully for HR approval!');
                  } catch (err) {
                    alert(err.message || 'Failed to submit loan application');
                  } finally {
                    setLoanSubmitting(false);
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Requested Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    placeholder="e.g. 50000"
                    value={loanForm.principalAmount}
                    onChange={(e) => setLoanForm({ ...loanForm, principalAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Repayment Tenure (Months)
                  </label>
                  <select
                    value={loanForm.tenureMonths}
                    onChange={(e) => setLoanForm({ ...loanForm, tenureMonths: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="1">1 Month (Next Payroll)</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (2 Years)</option>
                  </select>
                </div>

                {loanForm.principalAmount && Number(loanForm.principalAmount) > 0 && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                    <div className="flex justify-between items-center text-indigo-900 font-bold">
                      <span>Estimated Monthly EMI:</span>
                      <span className="text-base text-indigo-700">
                        ₹{(Number(loanForm.principalAmount) / Number(loanForm.tenureMonths || 1)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-600 mt-1">
                      Zero percent interest (company advance policy). Deducted automatically every pay period.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Purpose / Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Reason for advance or loan request..."
                    value={loanForm.reason}
                    onChange={(e) => setLoanForm({ ...loanForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoanModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loanSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 shadow"
                  >
                    {loanSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expense Claim Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Submit Expense Claim</h3>
                  <p className="text-xs text-gray-500">Non-taxable reimbursement processed via payroll</p>
                </div>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
                    alert('Please enter a valid expense amount.');
                    return;
                  }
                  try {
                    setExpenseSubmitting(true);
                    const res = await submitExpenseClaim({
                      category: expenseForm.category,
                      amount: parseFloat(expenseForm.amount),
                      merchant: expenseForm.merchant,
                      claimDate: expenseForm.claimDate,
                      description: expenseForm.description,
                      receiptUrl: expenseForm.receiptUrl
                    });
                    setExpenseClaims([res, ...expenseClaims]);
                    setShowExpenseModal(false);
                    setExpenseForm({
                      category: 'TRAVEL',
                      amount: '',
                      merchant: '',
                      claimDate: new Date().toISOString().split('T')[0],
                      description: '',
                      receiptUrl: ''
                    });
                    setSuccessMsg('Expense claim submitted successfully for manager approval!');
                    setTimeout(() => setSuccessMsg(''), 5000);
                  } catch (err) {
                    alert(err.message || 'Failed to submit expense claim');
                  } finally {
                    setExpenseSubmitting(false);
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                    >
                      <option value="TRAVEL">Travel / Cab / Flight</option>
                      <option value="MEALS">Client Meals / Dining</option>
                      <option value="BROADBAND">Broadband / Internet</option>
                      <option value="FUEL">Fuel / Petrol</option>
                      <option value="OTHER">Other Business Expense</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Claim Date
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseForm.claimDate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, claimDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 1500"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Vendor / Merchant
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uber / Airtel / Cafe"
                      value={expenseForm.merchant}
                      onChange={(e) => setExpenseForm({ ...expenseForm, merchant: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Description / Business Purpose
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide details about the business expense..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Receipt URL / Invoice Reference (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={expenseForm.receiptUrl}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={expenseSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50 shadow"
                  >
                    {expenseSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Form 12BB & Income Tax Regime Modal */}
        {showTaxModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Income Tax Declaration (Form 12BB)</h3>
                  <p className="text-xs text-gray-500">Choose tax regime &amp; claim Chapter VI-A statutory deductions</p>
                </div>
                <button
                  onClick={() => setShowTaxModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setTaxSubmitting(true);
                    const res = await submitMyTaxDeclaration({
                      financialYear: taxForm.financialYear,
                      regime: taxForm.regime,
                      section80C: taxForm.section80C ? parseFloat(taxForm.section80C) : 0,
                      section80D: taxForm.section80D ? parseFloat(taxForm.section80D) : 0,
                      section24HomeLoan: taxForm.section24HomeLoan ? parseFloat(taxForm.section24HomeLoan) : 0,
                      annualRentPaid: taxForm.annualRentPaid ? parseFloat(taxForm.annualRentPaid) : 0,
                      isMetro: taxForm.isMetro,
                      otherExemptions: taxForm.otherExemptions ? parseFloat(taxForm.otherExemptions) : 0
                    });
                    setTaxDecl(res);
                    setShowTaxModal(false);
                    setSuccessMsg('Income Tax Declaration (Form 12BB) submitted successfully!');
                    setTimeout(() => setSuccessMsg(''), 4000);
                  } catch (err) {
                    alert(err.message || 'Failed to submit tax declaration');
                  } finally {
                    setTaxSubmitting(false);
                  }
                }}
                className="space-y-4 text-xs"
              >
                {/* Tax Regime Selector */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Tax Regime</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTaxForm({ ...taxForm, regime: 'NEW_REGIME' })}
                      className={`p-3 rounded-xl border text-left transition ${
                        taxForm.regime === 'NEW_REGIME'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">New Regime (Sec 115BAC)</div>
                      <p className="text-[11px] text-gray-500 mt-1">Lower tax slabs, ₹75,000 std deduction, no exemptions</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaxForm({ ...taxForm, regime: 'OLD_REGIME' })}
                      className={`p-3 rounded-xl border text-left transition ${
                        taxForm.regime === 'OLD_REGIME'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Old Regime</div>
                      <p className="text-[11px] text-gray-500 mt-1">Traditional slabs with 80C, 80D, HRA &amp; Home Loan deductions</p>
                    </button>
                  </div>
                </div>

                {taxForm.regime === 'OLD_REGIME' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Section 80C (Max ₹1.5 Lakh)
                        </label>
                        <input
                          type="number"
                          placeholder="PPF, ELSS, Life Insurance"
                          value={taxForm.section80C}
                          onChange={(e) => setTaxForm({ ...taxForm, section80C: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Section 80D Mediclaim (Max ₹75K)
                        </label>
                        <input
                          type="number"
                          placeholder="Health insurance premium"
                          value={taxForm.section80D}
                          onChange={(e) => setTaxForm({ ...taxForm, section80D: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Section 24 Home Loan Interest
                        </label>
                        <input
                          type="number"
                          placeholder="Max ₹2,00,000"
                          value={taxForm.section24HomeLoan}
                          onChange={(e) => setTaxForm({ ...taxForm, section24HomeLoan: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Annual Rent Paid (for HRA)
                        </label>
                        <input
                          type="number"
                          placeholder="Total rent paid in year"
                          value={taxForm.annualRentPaid}
                          onChange={(e) => setTaxForm({ ...taxForm, annualRentPaid: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="isMetro"
                        checked={taxForm.isMetro}
                        onChange={(e) => setTaxForm({ ...taxForm, isMetro: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="isMetro" className="text-gray-700">
                        Rented accommodation is in a Metro city (Delhi, Mumbai, Kolkata, Chennai - 50% basic rule)
                      </label>
                    </div>
                  </div>
                )}

                {taxDecl?.projectedAnnualTax != null && (
                  <div className="p-3 bg-indigo-50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-indigo-900">Projected Annual Income Tax:</div>
                      <div className="text-[11px] text-indigo-600">Monthly TDS deduction: ₹{Number(taxDecl.monthlyTds || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-base font-extrabold text-indigo-700">
                      ₹{Number(taxDecl.projectedAnnualTax).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTaxModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={taxSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 shadow"
                  >
                    {taxSubmitting ? 'Saving Declaration...' : 'Save & Submit Form 12BB'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EmployeeDashboard;

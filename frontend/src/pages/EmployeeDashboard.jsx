import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/common/StatusBadge';
import LoanApplicationModal from '../components/employee/LoanApplicationModal';
import ExpenseClaimModal from '../components/employee/ExpenseClaimModal';
import TaxDeclarationModal from '../components/employee/TaxDeclarationModal';
import { formatCurrency } from '../utils/formatters';
import {
  getCurrentUser,
  getMyPayslips,
  downloadPayslipPdf,
  getMyLeaveBalances,
  getMyLoans,
  getMyTaxDeclaration,
  getMyExpenseClaims
} from '../services/api';

function EmployeeDashboard() {
  const [profile, setProfile] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loans, setLoans] = useState([]);
  const [expenseClaims, setExpenseClaims] = useState([]);
  const [taxDecl, setTaxDecl] = useState(null);

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);

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
        }
      } catch (err) {
        setError(err.message || 'Failed to load employee dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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

  function handleLoanSubmitted(newLoan) {
    setLoans((prev) => [newLoan, ...prev]);
    setSuccessMsg('Loan application submitted successfully for HR approval!');
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  function handleExpenseSubmitted(newClaim) {
    setExpenseClaims((prev) => [newClaim, ...prev]);
    setSuccessMsg('Expense claim submitted successfully for manager approval!');
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  function handleTaxSubmitted(updatedDecl) {
    setTaxDecl(updatedDecl);
    setSuccessMsg('Income Tax Declaration (Form 12BB) submitted successfully!');
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  const latestPayslip = payslips && payslips.length > 0 ? payslips[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Navbar */}
      <Navbar currentPage="Self-Service Portal" />

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
                {latestPayslip ? formatCurrency(latestPayslip.netPay) : '₹0.00'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {latestPayslip ? `Period: ${latestPayslip.month}/${latestPayslip.year} • Ref: ${latestPayslip.payslipRef}` : 'No recent payroll run found'}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Gross: {formatCurrency(latestPayslip?.grossEarned || 0)}</span>
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
                        {formatCurrency(record.grossEarned)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">
                        {formatCurrency(record.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-indigo-700">
                        {formatCurrency(record.netPay)}
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
                        {formatCurrency(ln.principalAmount)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-700">
                        {formatCurrency(ln.monthlyEmi)} / mo
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {ln.tenureMonths} Months
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {formatCurrency(ln.remainingPrincipal ?? ln.remainingBalance ?? ln.principalAmount ?? 0)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ln.status} />
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
                        {formatCurrency(claim.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={claim.status} />
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

        {/* Extracted Modals */}
        <LoanApplicationModal
          isOpen={showLoanModal}
          onClose={() => setShowLoanModal(false)}
          onLoanSubmitted={handleLoanSubmitted}
        />

        <ExpenseClaimModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onExpenseSubmitted={handleExpenseSubmitted}
        />

        <TaxDeclarationModal
          isOpen={showTaxModal}
          onClose={() => setShowTaxModal(false)}
          initialTaxDecl={taxDecl}
          onTaxSubmitted={handleTaxSubmitted}
        />
      </main>
    </div>
  );
}

export default EmployeeDashboard;

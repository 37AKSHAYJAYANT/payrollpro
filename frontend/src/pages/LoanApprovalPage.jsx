import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getPendingLoans, getAllLoans, approveLoan, rejectLoan } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function LoanApprovalPage() {
  const { role } = useAuth();

  const [pendingLoans, setPendingLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'rejected' | 'active' | 'all'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Rejection Remarks Modal State
  const [rejectModalLoan, setRejectModalLoan] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [pendingData, allData] = await Promise.all([
        getPendingLoans().catch(() => []),
        getAllLoans().catch(() => [])
      ]);
      setPendingLoans(pendingData || []);
      setAllLoans(allData || []);
    } catch (err) {
      setError(err.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id, empName) {
    if (!window.confirm(`Approve loan for ${empName || 'employee'}? Monthly EMI will be automatically deducted during monthly payroll runs.`)) return;
    try {
      setActionLoading(id);
      await approveLoan(id);
      setSuccessMsg('Loan approved successfully! It is now active with auto-EMI payroll recovery.');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to approve loan');
    } finally {
      setActionLoading(null);
    }
  }

  function openRejectModal(loan) {
    setRejectModalLoan(loan);
    setRejectRemarks('');
  }

  async function handleConfirmReject(e) {
    e.preventDefault();
    if (!rejectModalLoan) return;

    try {
      setRejectSubmitting(true);
      await rejectLoan(rejectModalLoan.id, rejectRemarks);
      setSuccessMsg(`Loan application for ${rejectModalLoan.employeeName || 'employee'} rejected.`);
      setRejectModalLoan(null);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to reject loan application');
    } finally {
      setRejectSubmitting(false);
    }
  }

  // Segmented Loans
  const rejectedLoans = allLoans.filter((l) => l.status === 'REJECTED');
  const activeLoans = allLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'APPROVED');
  const closedLoans = allLoans.filter((l) => l.status === 'CLOSED' || l.status === 'COMPLETED');

  // Filtered Loans for All / Active / Rejected views
  function getDisplayLoans() {
    let sourceList = allLoans;
    if (activeTab === 'pending') sourceList = pendingLoans;
    else if (activeTab === 'rejected') sourceList = rejectedLoans;
    else if (activeTab === 'active') sourceList = activeLoans;

    return sourceList.filter((loan) => {
      const matchesStatus =
        activeTab !== 'all' || statusFilter === 'ALL' || loan.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (loan.employeeName && loan.employeeName.toLowerCase().includes(term)) ||
        (loan.empCode && loan.empCode.toLowerCase().includes(term)) ||
        (loan.reason && loan.reason.toLowerCase().includes(term)) ||
        (loan.remarks && loan.remarks.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }

  const displayLoans = getDisplayLoans();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="Loan & Advance Approvals" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Corporate Loan &amp; Advance Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Auto-EMI Payroll Recovery
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review employee emergency credit applications, track rejected loans, and monitor ongoing active recovery schedules.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('pending')}
            className={`p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-center justify-between ${
              activeTab === 'pending'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingLoans.length}</p>
              <span className="text-[10px] text-gray-400">Applications awaiting action</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-700 font-bold text-lg">
              ⏳
            </div>
          </div>

          <div
            onClick={() => setActiveTab('rejected')}
            className={`p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-center justify-between ${
              activeTab === 'rejected'
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-gray-500">Rejected Loans</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">{rejectedLoans.length}</p>
              <span className="text-[10px] text-gray-400">With HR remarks history</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-700 font-bold text-lg">
              ✕
            </div>
          </div>

          <div
            onClick={() => setActiveTab('active')}
            className={`p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-center justify-between ${
              activeTab === 'active'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-gray-500">Active Loans</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeLoans.length}</p>
              <span className="text-[10px] text-gray-400">Monthly EMI deducted</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-700 font-bold text-lg">
              ✓
            </div>
          </div>

          <div
            onClick={() => setActiveTab('all')}
            className={`p-4 rounded-2xl border transition cursor-pointer shadow-sm flex items-center justify-between ${
              activeTab === 'all'
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-gray-500">Total Loans Ledger</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">{allLoans.length}</p>
              <span className="text-[10px] text-gray-400">All historical records</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100/70 flex items-center justify-center text-indigo-700 font-bold text-lg">
              💰
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold hover:text-red-900">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs sm:text-sm flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold hover:text-green-900">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingLoans.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                {pendingLoans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rejected'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Rejected Loans</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
              {rejectedLoans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'active'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Active Recovery ({activeLoans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>All Loans Ledger ({allLoans.length})</span>
          </button>
        </div>

        {/* Filter / Search Bar (available across all tabs) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by employee name, code, reason, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {activeTab === 'all' && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
              {['ALL', 'REQUESTED', 'ACTIVE', 'REJECTED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Pending Approvals View */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Pending Loan Requests</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Applications awaiting HR approval before monthly EMI activation.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                {pendingLoans.length} Action(s) Required
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-gray-500">Loading pending requests...</div>
            ) : pendingLoans.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400 space-y-2">
                <div className="text-3xl">🎉</div>
                <p className="font-semibold text-gray-700">All caught up!</p>
                <p className="text-xs text-gray-400">No pending loan applications requiring HR review.</p>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  View rejected loans history &rarr;
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Employee</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Principal Amount</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Monthly EMI</th>
                      <th className="px-6 py-3.5 font-semibold text-center">Tenure</th>
                      <th className="px-6 py-3.5 font-semibold">Purpose / Reason</th>
                      <th className="px-6 py-3.5 font-semibold">Applied Date</th>
                      <th className="px-6 py-3.5 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{loan.employeeName || `Employee #${loan.employeeId}`}</div>
                          <div className="text-xs font-mono text-gray-500">{loan.empCode || `ID: ${loan.employeeId}`}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-gray-900 text-sm sm:text-base">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-600">
                          {formatCurrency(loan.monthlyEmi)} / mo
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {loan.tenureMonths} Months
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate text-xs">
                          {loan.reason || 'Personal / Emergency'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(loan.id, loan.employeeName)}
                              disabled={actionLoading === loan.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(loan)}
                              disabled={actionLoading === loan.id}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Dedicated Rejected Loans View */}
        {activeTab === 'rejected' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-rose-50/40">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Rejected Loan Applications</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    {rejectedLoans.length} Rejected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete historical record of loan and advance requests turned down by HR with specific rejection remarks.
                </p>
              </div>
            </div>

            {displayLoans.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                No rejected loan records found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Employee</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Requested Amount</th>
                      <th className="px-6 py-3.5 font-semibold text-center">Tenure</th>
                      <th className="px-6 py-3.5 font-semibold">Employee Purpose</th>
                      <th className="px-6 py-3.5 font-semibold">Status</th>
                      <th className="px-6 py-3.5 font-semibold">HR Rejection Remarks</th>
                      <th className="px-6 py-3.5 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{loan.employeeName || `Employee #${loan.employeeId}`}</div>
                          <div className="text-xs font-mono text-gray-500">{loan.empCode || `ID: ${loan.employeeId}`}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-gray-900">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {loan.tenureMonths} Months
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs text-xs">
                          {loan.reason || 'Personal loan request'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            ✕ REJECTED
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 max-w-sm">
                          {loan.remarks ? (
                            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg italic">
                              "{loan.remarks}"
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No rejection remarks recorded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3 & 4: Active Loans & All Loans Ledger */}
        {(activeTab === 'active' || activeTab === 'all') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  {activeTab === 'active' ? 'Active Corporate Loans & Advance Ledger' : 'All Loans & Advances Master Ledger'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Outstanding principal balance and repayment status across workforce.
                </p>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Showing {displayLoans.length} record(s)
              </span>
            </div>

            {displayLoans.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                No loan records found matching the current criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Employee</th>
                      <th className="px-6 py-3 font-semibold text-right">Principal</th>
                      <th className="px-6 py-3 font-semibold text-right">Monthly EMI</th>
                      <th className="px-6 py-3 font-semibold text-center">Tenure</th>
                      <th className="px-6 py-3 font-semibold text-right">Remaining Principal</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Reason / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{loan.employeeName || `Employee #${loan.employeeId}`}</div>
                          <div className="text-xs font-mono text-gray-500">{loan.empCode || `ID: ${loan.employeeId}`}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          {formatCurrency(loan.monthlyEmi)} / mo
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {loan.tenureMonths} mo
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-indigo-700">
                          {formatCurrency(loan.remainingPrincipal || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            loan.status === 'ACTIVE' || loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            loan.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                            loan.status === 'CLOSED' || loan.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                          {loan.status === 'REJECTED' && loan.remarks ? (
                            <span className="text-rose-700 italic">Rejection reason: {loan.remarks}</span>
                          ) : (
                            loan.reason || '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rejection Remarks Modal */}
      {rejectModalLoan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Reject Loan Application
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                For {rejectModalLoan.employeeName || 'Employee'} ({rejectModalLoan.empCode}) • {formatCurrency(rejectModalLoan.principalAmount)} ({rejectModalLoan.tenureMonths} mo)
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  HR Rejection Reason / Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State clear reason for loan rejection (e.g. advance amount exceeds 3x salary limit, probationary employee, incomplete documentation)..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalLoan(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
                >
                  {rejectSubmitting ? 'Rejecting...' : 'Confirm Loan Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanApprovalPage;

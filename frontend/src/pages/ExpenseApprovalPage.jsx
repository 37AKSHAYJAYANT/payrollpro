import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/common/StatusBadge';
import ExpenseClaimModal from '../components/employee/ExpenseClaimModal';
import { formatCurrency } from '../utils/formatters';
import {
  getPendingExpenseClaims,
  getExpenseClaims,
  approveExpenseClaim,
  rejectExpenseClaim,
  getEmployees
} from '../services/api';

function ExpenseApprovalPage() {
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [pendingClaims, setPendingClaims] = useState([]);
  const [allClaims, setAllClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters for History tab
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Approve / Reject Action Modal State
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Submit Claim Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    loadData();
    getEmployees(0, 500)
      .then((data) => setEmployees(data.content || []))
      .catch(() => setEmployees([]));
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [pending, all] = await Promise.all([
        getPendingExpenseClaims().catch(() => []),
        getExpenseClaims().catch(() => [])
      ]);
      setPendingClaims(pending || []);
      setAllClaims(all || []);
    } catch (err) {
      setError(err.message || 'Failed to load expense reimbursement claims');
    } finally {
      setLoading(false);
    }
  }

  function openActionModal(claim, type) {
    setSelectedClaim(claim);
    setActionType(type);
    setActionRemarks('');
  }

  async function handleConfirmAction(e) {
    e.preventDefault();
    if (!selectedClaim) return;

    try {
      setActionSubmitting(true);
      if (actionType === 'APPROVE') {
        await approveExpenseClaim(selectedClaim.id, actionRemarks);
        setSuccessMsg(`Expense claim of ${formatCurrency(selectedClaim.amount)} approved for ${selectedClaim.employeeName || 'employee'}. It will be included in the next payroll disbursal.`);
      } else {
        await rejectExpenseClaim(selectedClaim.id, actionRemarks);
        setSuccessMsg(`Expense claim rejected.`);
      }
      setSelectedClaim(null);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || `Failed to ${actionType.toLowerCase()} claim`);
    } finally {
      setActionSubmitting(false);
    }
  }

  function handleClaimCreated(newClaim) {
    setSuccessMsg('Expense reimbursement claim submitted successfully!');
    loadData();
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  // Filtered History
  const filteredHistory = allClaims.filter((claim) => {
    const matchesCategory = categoryFilter === 'ALL' || claim.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (claim.employeeName && claim.employeeName.toLowerCase().includes(term)) ||
      (claim.empCode && claim.empCode.toLowerCase().includes(term)) ||
      (claim.merchant && claim.merchant.toLowerCase().includes(term)) ||
      (claim.description && claim.description.toLowerCase().includes(term)) ||
      (claim.category && claim.category.toLowerCase().includes(term));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Summary Metrics
  const pendingCount = pendingClaims.length;
  const approvedTotal = allClaims
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const rejectedCount = allClaims.filter((c) => c.status === 'REJECTED').length;
  const totalCount = allClaims.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="Expense Claims & Reimbursements" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Expense Claims &amp; Reimbursements
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Tax-Exempt Payroll Additions
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Verify employee receipts, approve business expenditure, and review company reimbursement ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Submit Expense Claim
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
              <span className="text-[10px] text-gray-400">Awaiting HR approval</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 text-lg font-bold">
              ⏳
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Approved Reimbursements</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(approvedTotal)}</p>
              <span className="text-[10px] text-gray-400">Processed in payroll</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg font-bold">
              💳
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Rejected Claims</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">{rejectedCount}</p>
              <span className="text-[10px] text-gray-400">Non-compliant bills</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 text-lg font-bold">
              ✕
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Claims</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">{totalCount}</p>
              <span className="text-[10px] text-gray-400">All submissions</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-lg font-bold">
              📊
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold hover:text-red-900">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold hover:text-emerald-900">✕</button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Claims &amp; Reimbursement History</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
              {allClaims.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">Pending Claims Queue</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Expense claims requiring verification and approval before payroll processing.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                {pendingClaims.length} Awaiting Action
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-gray-400">Loading pending claims...</div>
            ) : pendingClaims.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500 space-y-2">
                <div className="text-3xl">🎉</div>
                <p className="font-semibold text-gray-800">All caught up!</p>
                <p className="text-xs text-gray-400">No pending expense reimbursement claims requiring approval.</p>
                <button
                  onClick={() => setActiveTab('history')}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                >
                  View reimbursement ledger &rarr;
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Employee</th>
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                      <th className="px-5 py-3.5 font-semibold">Category</th>
                      <th className="px-5 py-3.5 font-semibold">Merchant / Purpose</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Claim Amount</th>
                      <th className="px-5 py-3.5 font-semibold text-center">Receipt</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50/70 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900">{claim.employeeName || `Employee #${claim.employeeId}`}</div>
                          <div className="text-xs text-blue-600 font-mono font-semibold">{claim.empCode || `EMP#${claim.employeeId}`}</div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-gray-600">
                          {claim.claimDate || '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {claim.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <div className="font-semibold text-gray-900">{claim.merchant || 'General Merchant'}</div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{claim.description || 'No description'}</div>
                        </td>
                        <td className="px-5 py-4 text-right font-extrabold text-gray-900 text-sm">
                          {formatCurrency(claim.amount)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {claim.receiptUrl ? (
                            <a
                              href={claim.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                            >
                              View Bill
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => openActionModal(claim, 'APPROVE')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal(claim, 'REJECT')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Claims & Reimbursement History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by employee, code, merchant, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="TRAVEL">Travel / Cab / Flight</option>
                  <option value="MEALS">Client Meals / Dining</option>
                  <option value="BROADBAND">Broadband / Internet</option>
                  <option value="FUEL">Fuel / Petrol</option>
                  <option value="OTHER">Other Business Expense</option>
                </select>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        statusFilter === st
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base">Reimbursement Ledger</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing {filteredHistory.length} of {allClaims.length} total claims
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-gray-400">Loading claims ledger...</div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">
                  No expense claims matching your search or filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold">Employee</th>
                        <th className="px-5 py-3.5 font-semibold">Date</th>
                        <th className="px-5 py-3.5 font-semibold">Category</th>
                        <th className="px-5 py-3.5 font-semibold">Merchant / Description</th>
                        <th className="px-5 py-3.5 font-semibold text-right">Amount</th>
                        <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                        <th className="px-5 py-3.5 font-semibold">Approver Remarks</th>
                        <th className="px-5 py-3.5 font-semibold text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredHistory.map((claim) => (
                        <tr key={claim.id} className="hover:bg-gray-50/70 transition">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">{claim.employeeName || `Employee #${claim.employeeId}`}</div>
                            <div className="text-xs text-blue-600 font-mono">{claim.empCode || `EMP#${claim.employeeId}`}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-gray-600">
                            {claim.claimDate || '-'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                              {claim.category}
                            </span>
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            <div className="font-medium text-gray-900">{claim.merchant || 'General'}</div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">{claim.description || '-'}</div>
                          </td>
                          <td className="px-5 py-4 text-right font-extrabold text-gray-900 whitespace-nowrap">
                            {formatCurrency(claim.amount)}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <StatusBadge status={claim.status} />
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-600 max-w-xs truncate">
                            {claim.remarks ? (
                              <span className="italic text-gray-800">"{claim.remarks}"</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            {claim.receiptUrl ? (
                              <a
                                href={claim.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Approve / Reject Confirmation Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Expense Claim
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedClaim.employeeName} ({selectedClaim.empCode}) • {formatCurrency(selectedClaim.amount)} ({selectedClaim.category})
              </p>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Manager / HR Remarks {actionType === 'REJECT' ? '(Required for rejection)' : '(Optional)'}
                </label>
                <textarea
                  rows={3}
                  required={actionType === 'REJECT'}
                  placeholder={
                    actionType === 'APPROVE'
                      ? 'Approved. Validated against tax invoice.'
                      : 'Reason for rejection (e.g. invalid receipt, policy limit exceeded)...'
                  }
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm disabled:opacity-50 ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionSubmitting
                    ? 'Submitting...'
                    : actionType === 'APPROVE'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Claim Modal for HR */}
      <ExpenseClaimModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onExpenseSubmitted={handleClaimCreated}
      />
    </div>
  );
}

export default ExpenseApprovalPage;

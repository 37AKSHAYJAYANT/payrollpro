import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPendingLeaveRequests, getAllLeaveRequests, approveLeave, rejectLeave } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function LeaveApprovalPage() {
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' or 'HISTORY'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Search & Filter state for History tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'APPROVED', 'REJECTED', 'PENDING'

  // Remarks modal state
  const [activeRequest, setActiveRequest] = useState(null);
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE' or 'REJECT'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { role, logout } = useAuth();
  const navigate = useNavigate();

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [pendingData, allData] = await Promise.all([
        getPendingLeaveRequests(),
        getAllLeaveRequests()
      ]);
      setPendingRequests(pendingData || []);
      setAllRequests(allData || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openActionModal(request, type) {
    setActiveRequest(request);
    setActionType(type);
    setRemarks('');
  }

  async function handleConfirmAction(e) {
    e.preventDefault();
    if (!activeRequest) return;

    setSubmitting(true);
    setError('');
    try {
      if (actionType === 'APPROVE') {
        await approveLeave(activeRequest.id, remarks);
        setActionSuccess(`Leave approved for ${activeRequest.employeeName || 'employee'}`);
      } else {
        await rejectLeave(activeRequest.id, remarks);
        setActionSuccess(`Leave rejected for ${activeRequest.employeeName || 'employee'}`);
      }
      setActiveRequest(null);
      await loadData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.message || `Failed to ${actionType.toLowerCase()} leave`);
    } finally {
      setSubmitting(false);
    }
  }

  // Filtered requests for history tab
  const filteredHistory = allRequests.filter((req) => {
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (req.employeeName && req.employeeName.toLowerCase().includes(term)) ||
      (req.empCode && req.empCode.toLowerCase().includes(term)) ||
      (req.department && req.department.toLowerCase().includes(term)) ||
      (req.leaveTypeName && req.leaveTypeName.toLowerCase().includes(term)) ||
      (req.reason && req.reason.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const approvedCount = allRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = allRequests.filter((r) => r.status === 'REJECTED').length;
  const pendingCount = pendingRequests.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar currentPage="Leave Approvals" pendingLeavesCount={pendingCount} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leave Management & Approvals</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Review pending employee leave requests and browse complete company-wide approval history.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-1.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Queue</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Approved Leaves</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{allRequests.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {actionSuccess}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${
                activeTab === 'PENDING'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Pending Approvals</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${
                activeTab === 'HISTORY'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Approval History</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {allRequests.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'PENDING' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Pending Review Queue</h2>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                {pendingRequests.length} Waiting
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Employee</th>
                    <th className="px-6 py-3.5 text-left">Department</th>
                    <th className="px-6 py-3.5 text-left">Leave Type</th>
                    <th className="px-6 py-3.5 text-left">Dates</th>
                    <th className="px-6 py-3.5 text-left">Days</th>
                    <th className="px-6 py-3.5 text-left">Reason</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        Loading pending approvals...
                      </td>
                    </tr>
                  ) : pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <div className="max-w-sm mx-auto text-center space-y-2">
                          <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="font-medium text-gray-900">All caught up!</p>
                          <p className="text-xs text-gray-500">There are no pending leave requests requiring approval at this time.</p>
                          <button
                            onClick={() => setActiveTab('HISTORY')}
                            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            View approval history &rarr;
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/70 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{req.employeeName || 'Unknown Employee'}</div>
                          <div className="text-xs text-indigo-600 font-semibold">{req.empCode || `EMP#${req.employeeId}`}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {req.department || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-800">{req.leaveTypeName || 'Leave'}</span>
                          {req.leaveTypeCode && <span className="ml-1 text-xs text-gray-400">({req.leaveTypeCode})</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          {req.fromDate} to {req.toDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                          {req.days}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate text-xs">
                          {req.reason || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => openActionModal(req, 'APPROVE')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal(req, 'REJECT')}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-xs font-medium transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Approval History / All Requests */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by name, employee code, department or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['ALL', 'APPROVED', 'REJECTED', 'PENDING'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      statusFilter === status
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All Status' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Leave Approval History</h2>
                <span className="text-xs text-gray-500 font-medium">
                  Showing {filteredHistory.length} of {allRequests.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Employee</th>
                      <th className="px-6 py-3.5 text-left">Department</th>
                      <th className="px-6 py-3.5 text-left">Leave Type</th>
                      <th className="px-6 py-3.5 text-left">Dates & Days</th>
                      <th className="px-6 py-3.5 text-left">Status</th>
                      <th className="px-6 py-3.5 text-left">Reason</th>
                      <th className="px-6 py-3.5 text-left">Approver Remarks</th>
                      <th className="px-6 py-3.5 text-left">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-400">
                          Loading approval history...
                        </td>
                      </tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-500">
                          No leave records found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50/70 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{req.employeeName || 'Unknown Employee'}</div>
                            <div className="text-xs text-indigo-600 font-semibold">{req.empCode || `EMP#${req.employeeId}`}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {req.department || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-gray-800">{req.leaveTypeName || 'Leave'}</span>
                            {req.leaveTypeCode && <span className="ml-1 text-xs text-gray-400">({req.leaveTypeCode})</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                            <div>{req.fromDate} to {req.toDate}</div>
                            <div className="font-bold text-gray-900 mt-0.5">{req.days} day(s)</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                req.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-800'
                                  : req.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {req.status === 'APPROVED' && (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {req.status === 'REJECTED' && (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {req.status === 'PENDING' && (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate text-xs">
                            {req.reason || '—'}
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate text-xs font-medium">
                            {req.remarks ? (
                              <span className="text-gray-800 italic">"{req.remarks}"</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            {req.approvedAt
                              ? new Date(req.approvedAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : req.createdAt
                              ? new Date(req.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approve/Reject Remarks Modal */}
      {activeRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Leave Request
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              For <span className="font-semibold">{activeRequest.employeeName || 'Employee'}</span> ({activeRequest.empCode}) • {activeRequest.days} day(s)
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Manager / HR Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder={actionType === 'APPROVE' ? 'Approved. Enjoy your time off!' : 'Reason for rejection...'}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                    actionType === 'APPROVE'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Processing...' : `Confirm ${actionType === 'APPROVE' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveApprovalPage;

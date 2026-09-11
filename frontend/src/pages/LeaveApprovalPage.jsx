import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPendingLeaveRequests, approveLeave, rejectLeave } from '../services/api';
import { useAuth } from '../context/AuthContext';

function LeaveApprovalPage() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Remarks modal state
  const [activeRequest, setActiveRequest] = useState(null);
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE' or 'REJECT'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { role, logout } = useAuth();
  const navigate = useNavigate();

  async function loadPending() {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingLeaveRequests();
      setPendingRequests(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
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
        setActionSuccess(`Leave approved for ${activeRequest.employeeName}`);
      } else {
        await rejectLeave(activeRequest.id, remarks);
        setActionSuccess(`Leave rejected for ${activeRequest.employeeName}`);
      }
      setActiveRequest(null);
      loadPending();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.message || `Failed to ${actionType.toLowerCase()} leave`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="text-xl font-bold text-indigo-600">PayrollPro</Link>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-700">Leave Approval Queue</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                Dashboard
              </Link>
              <Link to="/leaves" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                My Leaves
              </Link>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {role}
              </span>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-sm text-gray-500 hover:text-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Leave Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve or reject employee leave requests. Approving automatically updates employee balances.
          </p>
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

        {/* Pending Queue Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Queue Items</h2>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
              {pendingRequests.length} Pending
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
                      All caught up! No pending leave requests.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{req.employeeName}</div>
                        <div className="text-xs text-indigo-600 font-semibold">{req.empCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {req.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">{req.leaveTypeName}</span>
                        <span className="ml-1 text-xs text-gray-400">({req.leaveTypeCode})</span>
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
      </div>

      {/* Approve/Reject Remarks Modal */}
      {activeRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Leave Request
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              For <span className="font-semibold">{activeRequest.employeeName}</span> ({activeRequest.empCode}) • {activeRequest.days} day(s)
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Manager Remarks (Optional)
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

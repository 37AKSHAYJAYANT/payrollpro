import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyLeaveBalances, getMyLeaveRequests, getLeaveTypes } from '../services/api';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import LeaveRequestForm from '../components/LeaveRequestForm';
import { useAuth } from '../context/AuthContext';

function LeaveHistoryPage() {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const { role, logout } = useAuth();
  const navigate = useNavigate();

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [balData, reqData, typeData] = await Promise.all([
        getMyLeaveBalances(),
        getMyLeaveRequests(),
        getLeaveTypes()
      ]);
      setBalances(balData || []);
      setRequests(reqData || []);
      setLeaveTypes(typeData || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link to="/dashboard" className="text-lg sm:text-xl font-bold text-indigo-600">PayrollPro</Link>
              <span className="hidden sm:inline text-sm text-gray-400">/</span>
              <span className="hidden sm:inline text-sm font-medium text-gray-700">My Leaves</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/dashboard" className="text-xs sm:text-sm text-gray-600 hover:text-indigo-600 transition">
                Dashboard
              </Link>
              {(role === 'MANAGER' || role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                <Link to="/leaves/approvals" className="text-xs sm:text-sm text-indigo-600 hover:underline font-medium">
                  Approvals →
                </Link>
              )}
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-indigo-100 text-indigo-800">
                {role}
              </span>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-xs sm:text-sm text-gray-500 hover:text-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* Header with Apply Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Track your remaining balances and view past leave requests
            </p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="w-full sm:w-auto text-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-sm"
          >
            + Apply for Leave
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Leave Balance Cards Grid */}
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 sm:mb-4">
            Current Year Quota &amp; Balances ({new Date().getFullYear()})
          </h2>
          {loading ? (
            <div className="text-sm text-gray-400">Loading leave balances...</div>
          ) : balances.length === 0 ? (
            <div className="text-sm text-gray-500 bg-white p-6 rounded-xl border">
              No leave balances found for current user account.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              {balances.map((balance) => (
                <LeaveBalanceCard key={balance.id} balance={balance} />
              ))}
            </div>
          )}
        </div>

        {/* Leave History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Leave History</h2>
            <span className="text-xs text-gray-400">{requests.length} requests total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Loading history...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {req.leaveTypeName}
                        <span className="ml-1.5 text-xs text-gray-400">({req.leaveTypeCode})</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-xs">
                        {req.fromDate} to {req.toDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                        {req.days}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {req.reason || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            req.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : req.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">
                        {req.remarks || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Apply for Leave</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <LeaveRequestForm
              leaveTypes={leaveTypes}
              onSuccess={() => {
                setShowApplyModal(false);
                loadData();
              }}
              onCancel={() => setShowApplyModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveHistoryPage;

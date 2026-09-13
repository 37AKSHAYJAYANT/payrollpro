import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getPendingLoans, getAllLoans, approveLoan, rejectLoan } from '../services/api';

function LoanApprovalPage() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingLoans, setPendingLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  async function handleApprove(id) {
    if (!window.confirm('Approve this loan? Monthly EMI will be automatically deducted during payroll.')) return;
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

  async function handleReject(id) {
    if (!window.confirm('Are you sure you want to reject this loan application?')) return;
    try {
      setActionLoading(id);
      await rejectLoan(id);
      setSuccessMsg('Loan application rejected.');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to reject loan');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar currentPage="Loan & Advance Approvals" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Corporate Loan & Advance Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review employee emergency credit applications and monitor automated monthly EMI recovery.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'pending'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              Pending Approval ({pendingLoans.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              All Loans Ledger ({allLoans.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 font-bold hover:text-red-700">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-green-500 font-bold hover:text-green-700">✕</button>
          </div>
        )}

        {/* Pending Loans Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pending Loan Requests</h2>
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
              <div className="p-12 text-center text-sm text-gray-400">
                🎉 No pending loan applications. All requests have been reviewed!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Employee</th>
                      <th className="px-6 py-3 font-semibold text-right">Principal Amount</th>
                      <th className="px-6 py-3 font-semibold text-right">Monthly EMI</th>
                      <th className="px-6 py-3 font-semibold text-center">Tenure</th>
                      <th className="px-6 py-3 font-semibold">Purpose / Reason</th>
                      <th className="px-6 py-3 font-semibold">Applied Date</th>
                      <th className="px-6 py-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{loan.employeeName || `Employee #${loan.employeeId}`}</div>
                          <div className="text-xs font-mono text-gray-500">{loan.empCode || `ID: ${loan.employeeId}`}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-gray-900 text-base">
                          ₹{parseFloat(loan.principalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-600">
                          ₹{parseFloat(loan.monthlyEmi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} / mo
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {loan.tenureMonths} Months
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate text-xs">
                          {loan.reason || 'Personal / Emergency'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(loan.id)}
                              disabled={actionLoading === loan.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(loan.id)}
                              disabled={actionLoading === loan.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
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

        {/* All Loans Ledger Tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">All Company Loans & Advances Ledger</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete record of active, closed, and requested loans with outstanding principal balances.
              </p>
            </div>

            {allLoans.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                No loan records found in the system.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Employee</th>
                      <th className="px-6 py-3 font-semibold text-right">Principal</th>
                      <th className="px-6 py-3 font-semibold text-right">Monthly EMI</th>
                      <th className="px-6 py-3 font-semibold text-center">Tenure</th>
                      <th className="px-6 py-3 font-semibold text-right">Remaining Principal</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{loan.employeeName || `Employee #${loan.employeeId}`}</div>
                          <div className="text-xs font-mono text-gray-500">{loan.empCode || `ID: ${loan.employeeId}`}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          ₹{parseFloat(loan.principalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          ₹{parseFloat(loan.monthlyEmi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} / mo
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {loan.tenureMonths} mo
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-indigo-700">
                          ₹{parseFloat(loan.remainingPrincipal || loan.remainingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            loan.status === 'ACTIVE' || loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            loan.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            loan.status === 'CLOSED' || loan.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                          {loan.reason || '-'}
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
    </div>
  );
}

export default LoanApprovalPage;

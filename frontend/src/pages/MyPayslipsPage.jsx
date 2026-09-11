import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyPayslips, downloadPayslipPdf, getCurrentUser } from '../services/api';

function MyPayslipsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [payslips, setPayslips] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchYear, setSearchYear] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const [pData, uData] = await Promise.all([
          getMyPayslips(),
          getCurrentUser().catch(() => null)
        ]);
        setPayslips(pData || []);
        setProfile(uData);
      } catch (err) {
        setError(err.message || 'Failed to load payslips');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDownload(record) {
    try {
      setDownloadingId(record.id);
      await downloadPayslipPdf(record.id, `Payslip-${record.payslipRef || record.id}.pdf`);
    } catch (err) {
      alert(err.message || 'Error downloading PDF');
    } finally {
      setDownloadingId(null);
    }
  }

  const filteredPayslips = payslips.filter((p) => {
    if (searchYear !== 'ALL' && p.year !== parseInt(searchYear, 10)) {
      return false;
    }
    return true;
  });

  const uniqueYears = Array.from(new Set(payslips.map((p) => p.year))).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <Link
                  to="/employee/payslips"
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50"
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
                  {profile?.empCode || ''}
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Payslip Statements</h1>
            <p className="text-sm text-gray-500 mt-1">
              Access and download verified monthly salary slips with statutory breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-500 uppercase">Year Filter:</label>
            <select
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white font-medium text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Years</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-500">Loading payslip archive...</div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No payslips found for this selection.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Pay Period</th>
                    <th className="px-6 py-4 font-semibold">Reference</th>
                    <th className="px-6 py-4 font-semibold text-right">Attendance</th>
                    <th className="px-6 py-4 font-semibold text-right">Gross Earnings</th>
                    <th className="px-6 py-4 font-semibold text-right">Deductions</th>
                    <th className="px-6 py-4 font-semibold text-right">Net Pay</th>
                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayslips.map((r) => (
                    <tr key={r.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {r.month}/{r.year}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {r.payslipRef}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-600">
                        <span className="font-bold text-gray-900">{r.payableDays}</span> / {r.totalWorkingDays} days
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        ₹{parseFloat(r.grossEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">
                        ₹{parseFloat(r.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-indigo-700">
                        ₹{parseFloat(r.netPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          View Breakdown
                        </button>
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {downloadingId === r.id ? 'Generating...' : 'Download PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Breakdown Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Payslip Breakdown — {selectedRecord.month}/{selectedRecord.year}
                  </h3>
                  <p className="text-xs text-gray-500">Ref: {selectedRecord.payslipRef}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Earnings breakdown */}
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-200/60 space-y-2">
                  <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider">Earnings</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Basic Salary:</span>
                    <span className="font-semibold text-gray-900">₹{parseFloat(selectedRecord.basicEarned || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">HRA:</span>
                    <span className="font-semibold text-gray-900">₹{parseFloat(selectedRecord.hraEarned || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Special Allowance:</span>
                    <span className="font-semibold text-gray-900">₹{parseFloat(selectedRecord.specialAllowanceEarned || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-green-200 flex justify-between text-xs font-bold text-green-900">
                    <span>Total Gross:</span>
                    <span>₹{parseFloat(selectedRecord.grossEarned || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions breakdown */}
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-200/60 space-y-2">
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Deductions</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">EPF (Employee):</span>
                    <span className="font-semibold text-gray-900">₹{parseFloat(selectedRecord.epfDeduction || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Professional Tax:</span>
                    <span className="font-semibold text-gray-900">₹{parseFloat(selectedRecord.professionalTax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">TDS (Income Tax):</span>
                    <span className="font-semibold text-gray-900">₹{parseFloat(selectedRecord.tdsDeduction || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-red-200 flex justify-between text-xs font-bold text-red-900">
                    <span>Total Deductions:</span>
                    <span>₹{parseFloat(selectedRecord.totalDeductions || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex justify-between items-center">
                <div>
                  <div className="text-xs text-indigo-700 font-medium">Net Take-Home Salary</div>
                  <div className="text-2xl font-black text-indigo-950">
                    ₹{parseFloat(selectedRecord.netPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedRecord)}
                  disabled={downloadingId === selectedRecord.id}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {downloadingId === selectedRecord.id ? 'Generating...' : 'Download Official PDF'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyPayslipsPage;

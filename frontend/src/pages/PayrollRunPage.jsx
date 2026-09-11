import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  executePayrollRun,
  getAllPayrollRuns,
  getPayrollRecordsForRun,
  reviewPayrollRun,
  approvePayrollRun,
  lockPayrollRun,
  downloadPayslipPdf
} from '../services/api';
import { useAuth } from '../context/AuthContext';

function PayrollRunPage() {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningPayroll, setRunningPayroll] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selector for new run
  const [month, setMonth] = useState(9); // September
  const [year, setYear] = useState(2026);

  const { role, logout } = useAuth();
  const navigate = useNavigate();

  async function loadRuns() {
    setLoading(true);
    setError('');
    try {
      const allRuns = await getAllPayrollRuns();
      setRuns(allRuns || []);
      if (allRuns && allRuns.length > 0) {
        selectRun(allRuns[0].id);
      } else {
        setSelectedRun(null);
        setRecords([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  }

  async function selectRun(runId) {
    try {
      const runItem = runs.find((r) => r.id === runId);
      if (runItem) setSelectedRun(runItem);
      const recs = await getPayrollRecordsForRun(runId);
      setRecords(recs || []);
    } catch (err) {
      setError(err.message || 'Failed to load records for run');
    }
  }

  useEffect(() => {
    loadRuns();
  }, []);

  async function handleTriggerRun(e) {
    e.preventDefault();
    setRunningPayroll(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await executePayrollRun(month, year);
      setSuccessMsg(`Payroll calculation completed for ${month}/${year}! Total Net: ₹${Number(result.totalNetPay).toLocaleString('en-IN')}`);
      await loadRuns();
      setSelectedRun(result);
      const recs = await getPayrollRecordsForRun(result.id);
      setRecords(recs);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to execute payroll run');
    } finally {
      setRunningPayroll(false);
    }
  }

  async function handleReview() {
    if (!selectedRun) return;
    setActionLoading(true);
    try {
      const updated = await reviewPayrollRun(selectedRun.id);
      setSelectedRun(updated);
      setSuccessMsg('Payroll run successfully reviewed by Manager!');
      loadRuns();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to review payroll');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedRun) return;
    setActionLoading(true);
    try {
      const updated = await approvePayrollRun(selectedRun.id);
      setSelectedRun(updated);
      setSuccessMsg('Payroll run officially approved!');
      loadRuns();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to approve payroll');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLock() {
    if (!selectedRun) return;
    if (!window.confirm('Locking this payroll run will finalize it permanently. No re-runs or edits will be permitted. Proceed?')) {
      return;
    }
    setActionLoading(true);
    try {
      const updated = await lockPayrollRun(selectedRun.id);
      setSelectedRun(updated);
      setSuccessMsg('Payroll run has been locked and finalized.');
      loadRuns();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to lock payroll');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadPayslip(record) {
    try {
      setDownloadingPdfId(record.id);
      await downloadPayslipPdf(record.id, `Payslip-${record.payslipRef || record.id}.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download payslip');
    } finally {
      setDownloadingPdfId(null);
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
              <span className="text-sm font-medium text-gray-700">Payroll Engine</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                Dashboard
              </Link>
              <Link to="/attendance" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                Attendance
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
        {/* Trigger Payroll Run Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch Payroll Calculation</h1>
            <p className="mt-1 text-sm text-gray-500">
              Calculate salary prorations, EPF, PT, and TDS for all active employees
            </p>
          </div>

          {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
            <form onSubmit={handleTriggerRun} className="flex flex-wrap items-center gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>{name}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>

              <button
                type="submit"
                disabled={runningPayroll}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {runningPayroll ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Batch...
                  </>
                ) : (
                  '▶ Run Payroll'
                )}
              </button>
            </form>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {successMsg}
          </div>
        )}

        {/* Runs History Selector & Active Run Status */}
        {runs.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
              Pay Cycles:
            </span>
            {runs.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRun(r); selectRun(r.id); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedRun && selectedRun.id === r.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border text-gray-700 hover:bg-gray-100'
                }`}
              >
                {r.month}/{r.year} ({r.status})
              </button>
            ))}
          </div>
        )}

        {selectedRun ? (
          <>
            {/* Run Summary Dashboard & Approval Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      Pay Cycle {selectedRun.month}/{selectedRun.year}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedRun.status === 'LOCKED'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedRun.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : selectedRun.status === 'MANAGER_REVIEWED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedRun.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Processed for {selectedRun.employeeCount} employees
                  </p>
                </div>

                {/* 3-Step Approval Workflow Buttons */}
                <div className="flex items-center gap-3">
                  {selectedRun.status === 'DRAFT' && (role === 'MANAGER' || role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                    <button
                      onClick={handleReview}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                    >
                      Step 1: Mark Reviewed
                    </button>
                  )}

                  {selectedRun.status === 'MANAGER_REVIEWED' && (role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                    >
                      Step 2: Approve Run
                    </button>
                  )}

                  {selectedRun.status === 'APPROVED' && (role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                    <button
                      onClick={handleLock}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                    >
                      Step 3: Lock &amp; Finalize
                    </button>
                  )}

                  {selectedRun.status === 'LOCKED' && (
                    <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-lg">
                      🔒 Payroll Finalized
                    </span>
                  )}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Gross Earnings</span>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    ₹{Number(selectedRun.totalGrossPay).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Statutory Deductions</span>
                  <div className="mt-1 text-2xl font-extrabold text-red-600">
                    ₹{Number(selectedRun.totalDeductions).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <span className="text-xs font-semibold text-indigo-700 uppercase">Total Net Disbursement</span>
                  <div className="mt-1 text-2xl font-extrabold text-indigo-600">
                    ₹{Number(selectedRun.totalNetPay).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Records Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Employee Breakdown Records</h3>
                <span className="text-xs text-gray-400">{records.length} line items</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Employee</th>
                      <th className="px-6 py-3.5 text-center">Payable / Working</th>
                      <th className="px-6 py-3.5 text-right">Basic Earned</th>
                      <th className="px-6 py-3.5 text-right">Gross Earned</th>
                      <th className="px-6 py-3.5 text-right">EPF</th>
                      <th className="px-6 py-3.5 text-right">PT</th>
                      <th className="px-6 py-3.5 text-right">TDS</th>
                      <th className="px-6 py-3.5 text-right">Total Deductions</th>
                      <th className="px-6 py-3.5 text-right">Net Pay</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-center">Payslip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {records.map((r) => (
                      <tr
                        key={r.id}
                        className={`transition ${r.isAnomaly ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50/70'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{r.employeeName}</div>
                          <div className="text-xs text-indigo-600 font-semibold">{r.empCode} • {r.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                          <span className="font-bold text-gray-900">{r.payableDays}</span> / {r.totalWorkingDays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                          ₹{Number(r.basicEarned).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                          ₹{Number(r.grossEarned).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 text-xs">
                          ₹{Number(r.epfDeduction).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 text-xs">
                          ₹{r.professionalTax}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 text-xs">
                          ₹{Number(r.tdsDeduction).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-red-600">
                          ₹{Number(r.totalDeductions).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-extrabold text-indigo-600">
                          ₹{Number(r.netPay).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {r.isAnomaly ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              Anomaly
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDownloadPayslip(r)}
                            disabled={downloadingPdfId === r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                            title="Download Payslip PDF"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {downloadingPdfId === r.id ? '...' : 'PDF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Payroll Runs Yet</h3>
            <p className="text-sm text-gray-400 mb-6">
              Select a month and year above, then click "Run Payroll" to generate your first pay cycle calculation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PayrollRunPage;

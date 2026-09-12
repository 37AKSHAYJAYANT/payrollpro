import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  executePayrollRun,
  getAllPayrollRuns,
  getPayrollRecordsForRun,
  reviewPayrollRun,
  approvePayrollRun,
  lockPayrollRun,
  downloadPayslipPdf,
  validateBankDisbursal,
  downloadBankDisbursal,
  getStatutorySummary,
  downloadEpfoEcrText,
  downloadEsicReturnCsv,
  sendBatchPayslips,
  sendPayslipEmail,
  getVariablePayForMonth,
  addVariablePayEntry,
  deleteVariablePayEntry,
  uploadVariablePayCsv
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

  // Bank disbursal export modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankFormat, setBankFormat] = useState('GENERIC_NEFT');
  const [bankValidation, setBankValidation] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankExporting, setBankExporting] = useState(false);

  // Statutory Compliance modal state
  const [showStatutoryModal, setShowStatutoryModal] = useState(false);
  const [statutorySummary, setStatutorySummary] = useState(null);
  const [statutoryLoading, setStatutoryLoading] = useState(false);
  const [statutoryDownloading, setStatutoryDownloading] = useState(null);

  // Email distribution state
  const [emailingBatch, setEmailingBatch] = useState(false);
  const [emailingRecordId, setEmailingRecordId] = useState(null);

  // Variable Pay modal state
  const [showVariablePayModal, setShowVariablePayModal] = useState(false);
  const [variablePayEntries, setVariablePayEntries] = useState([]);
  const [variablePayLoading, setVariablePayLoading] = useState(false);
  const [varPayForm, setVarPayForm] = useState({ employeeId: '', type: 'BONUS', amount: '', remarks: '' });
  const [varPaySubmitting, setVarPaySubmitting] = useState(false);

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

  async function handleOpenBankModal() {
    if (!selectedRun) return;
    setShowBankModal(true);
    setBankLoading(true);
    try {
      const summary = await validateBankDisbursal(selectedRun.id);
      setBankValidation(summary);
    } catch (err) {
      setError(err.message || 'Failed to validate bank details');
    } finally {
      setBankLoading(false);
    }
  }

  async function handleExportBankFile() {
    if (!selectedRun) return;
    setBankExporting(true);
    try {
      await downloadBankDisbursal(selectedRun.id, bankFormat);
      setSuccessMsg(`Bank disbursal file (${bankFormat}) exported successfully!`);
      setShowBankModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to export bank file');
    } finally {
      setBankExporting(false);
    }
  }

  async function handleOpenStatutoryModal() {
    if (!selectedRun) return;
    setShowStatutoryModal(true);
    setStatutoryLoading(true);
    try {
      const summary = await getStatutorySummary(selectedRun.id);
      setStatutorySummary(summary);
    } catch (err) {
      setError(err.message || 'Failed to load statutory summary');
    } finally {
      setStatutoryLoading(false);
    }
  }

  async function handleDownloadEcr() {
    if (!selectedRun) return;
    setStatutoryDownloading('ecr');
    try {
      await downloadEpfoEcrText(selectedRun.id);
      setSuccessMsg('EPFO ECR file downloaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to download EPFO ECR');
    } finally {
      setStatutoryDownloading(null);
    }
  }

  async function handleDownloadEsic() {
    if (!selectedRun) return;
    setStatutoryDownloading('esic');
    try {
      await downloadEsicReturnCsv(selectedRun.id);
      setSuccessMsg('ESIC Return CSV downloaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to download ESIC Return');
    } finally {
      setStatutoryDownloading(null);
    }
  }

  async function handleSendBatchPayslips() {
    if (!selectedRun) return;
    if (!window.confirm(`Queue encrypted password-protected payslip emails for all ${selectedRun.employeeCount} employees?`)) return;
    setEmailingBatch(true);
    try {
      await sendBatchPayslips(selectedRun.id);
      setSuccessMsg(`Payslip distribution queued! Encrypted PDFs with AES-128 are being sent to employee mailboxes.`);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setError(err.message || 'Failed to dispatch batch payslip emails');
    } finally {
      setEmailingBatch(false);
    }
  }

  async function handleSendSingleEmail(record) {
    setEmailingRecordId(record.id);
    try {
      await sendPayslipEmail(record.id);
      setSuccessMsg(`Encrypted payslip email queued for ${record.employeeName || 'employee'}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to send payslip email');
    } finally {
      setEmailingRecordId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link to="/dashboard" className="text-lg sm:text-xl font-bold text-indigo-600">PayrollPro</Link>
              <span className="hidden sm:inline text-sm text-gray-400">/</span>
              <span className="hidden sm:inline text-sm font-medium text-gray-700">Payroll Engine</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/dashboard" className="text-xs sm:text-sm text-gray-600 hover:text-indigo-600 transition">
                Dashboard
              </Link>
              <Link to="/employees" className="hidden sm:inline text-xs sm:text-sm text-gray-600 hover:text-indigo-600 transition">
                Employees
              </Link>
              <Link to="/attendance" className="hidden sm:inline text-xs sm:text-sm text-gray-600 hover:text-indigo-600 transition">
                Attendance
              </Link>
              <Link to="/leaves/approvals" className="text-xs sm:text-sm text-gray-600 hover:text-indigo-600 transition">
                Leaves
              </Link>
              <Link to="/loans/approvals" className="text-xs sm:text-sm text-gray-600 hover:text-indigo-600 transition">
                Loans
              </Link>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Trigger Payroll Run Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Batch Payroll Calculation</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Calculate salary prorations, EPF, PT, and TDS for all active employees
            </p>
          </div>

          {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
            <form onSubmit={handleTriggerRun} className="flex flex-wrap items-center gap-2 sm:gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>

              <button
                type="submit"
                disabled={runningPayroll}
                className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 space-y-5 sm:space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Pay Cycle {selectedRun.month}/{selectedRun.year}
                    </h2>
                    <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
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
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {selectedRun.status === 'DRAFT' && (role === 'MANAGER' || role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                    <>
                      <button
                        onClick={() => setShowVariablePayModal(true)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Manage Variable Pay
                      </button>
                      <button
                        onClick={handleReview}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                      >
                        Step 1: Mark Reviewed
                      </button>
                    </>
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

                  {(selectedRun.status === 'APPROVED' || selectedRun.status === 'LOCKED') && (role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                    <>
                      <button
                        onClick={handleOpenBankModal}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Bank Disbursal
                      </button>
                      <button
                        onClick={handleOpenStatutoryModal}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Statutory Returns (EPFO / ESIC)
                      </button>
                      <button
                        onClick={handleSendBatchPayslips}
                        disabled={emailingBatch}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                        title="Distribute encrypted password-protected payslips to all employees via email"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {emailingBatch ? 'Dispatching...' : 'Email All Payslips'}
                      </button>
                    </>
                  )}

                  {selectedRun.status === 'LOCKED' && (
                    <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-lg">
                      🔒 Payroll Finalized
                    </span>
                  )}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Gross Earnings</span>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-gray-900">
                    ₹{Number(selectedRun.totalGrossPay).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Statutory Deductions</span>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-red-600">
                    ₹{Number(selectedRun.totalDeductions).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <span className="text-xs font-semibold text-indigo-700 uppercase">Total Net Disbursement</span>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-indigo-600">
                    ₹{Number(selectedRun.totalNetPay).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Records Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Employee Breakdown Records</h3>
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
                          <button
                            onClick={() => handleSendSingleEmail(r)}
                            disabled={emailingRecordId === r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 ml-1.5"
                            title="Email Encrypted Payslip to Employee"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {emailingRecordId === r.id ? '...' : 'Email'}
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

      {/* Bank Disbursal Export Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg">
                  🏦
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bank Disbursal Export</h3>
                  <p className="text-xs text-gray-500">Corporate banking batch payment upload file</p>
                </div>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Format selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Corporate Bank Profile
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'GENERIC_NEFT', label: 'Generic NEFT', desc: 'Standard CSV file' },
                    { id: 'HDFC_CMS', label: 'HDFC Bank CMS', desc: 'Pipe-delimited upload' },
                    { id: 'ICICI_CIB', label: 'ICICI Bank CIB', desc: 'Corporate template' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setBankFormat(fmt.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        bankFormat === fmt.id
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-900">{fmt.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-flight validation summary */}
              {bankLoading ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mb-2" />
                  <div>Validating bank accounts and IFSC codes...</div>
                </div>
              ) : bankValidation ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <div className="text-[11px] text-gray-400 uppercase font-semibold">Total Records</div>
                      <div className="text-base font-bold text-gray-800">{bankValidation.totalRecords}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-center">
                      <div className="text-[11px] text-emerald-700 uppercase font-semibold">Valid Payouts</div>
                      <div className="text-base font-bold text-emerald-600">{bankValidation.validRecords}</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-center">
                      <div className="text-[11px] text-amber-700 uppercase font-semibold">Flagged / Invalid</div>
                      <div className="text-base font-bold text-amber-600">{bankValidation.invalidRecords}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-medium text-indigo-900">Total Net Disbursal:</span>
                    <span className="font-extrabold text-indigo-700 text-sm">
                      ₹{Number(bankValidation.totalPayout || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {bankValidation.errors && bankValidation.errors.length > 0 && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 max-h-28 overflow-y-auto">
                      <div className="font-semibold text-amber-900 flex items-center gap-1">
                        ⚠️ Pre-Flight Warnings ({bankValidation.errors.length}):
                      </div>
                      {bankValidation.errors.slice(0, 4).map((err, idx) => (
                        <div key={idx} className="text-amber-800 text-[11px]">
                          • <span className="font-mono font-medium">{err.empCode}</span>: {err.issue}
                        </div>
                      ))}
                      {bankValidation.errors.length > 4 && (
                        <div className="text-[10px] text-amber-700 italic">
                          +{bankValidation.errors.length - 4} more warnings in run...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExportBankFile}
                disabled={bankExporting || bankLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {bankExporting ? 'Exporting File...' : 'Download Bank Disbursal File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Compliance Returns Modal */}
      {showStatutoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>🏛️ Statutory Returns &amp; Government Filings</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pre-formatted official filing exports for EPFO unified portal &amp; ESIC contribution returns
                </p>
              </div>
              <button
                onClick={() => setShowStatutoryModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {statutoryLoading ? (
              <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                <div>Calculating statutory contributions &amp; wage ceilings...</div>
              </div>
            ) : statutorySummary ? (
              <div className="space-y-4 text-xs">
                {/* EPFO Section */}
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                        <span>EPFO Electronic Challan cum Return (ECR)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200 text-blue-800">#~# Delimited</span>
                      </h4>
                      <p className="text-[11px] text-blue-700">Wage ceiling ₹15,000 | 12% EE + 8.33% EPS + 3.67% ER</p>
                    </div>
                    <button
                      onClick={handleDownloadEcr}
                      disabled={statutoryDownloading === 'ecr'}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {statutoryDownloading === 'ecr' ? 'Downloading...' : 'Download ECR (.txt)'}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-100 text-center">
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <div className="text-[10px] text-gray-400 font-semibold">Eligible Staff</div>
                      <div className="text-xs font-bold text-gray-800">{statutorySummary.epfEligibleCount}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <div className="text-[10px] text-gray-400 font-semibold">EPF Wages</div>
                      <div className="text-xs font-bold text-blue-700">₹{Number(statutorySummary.totalEpfWages || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <div className="text-[10px] text-gray-400 font-semibold">EE Share (12%)</div>
                      <div className="text-xs font-bold text-emerald-700">₹{Number(statutorySummary.totalEeEpfContribution || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <div className="text-[10px] text-gray-400 font-semibold">EPS Share (8.33%)</div>
                      <div className="text-xs font-bold text-purple-700">₹{Number(statutorySummary.totalEpsContribution || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* ESIC Section */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                        <span>ESIC Monthly Return of Contribution</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">CSV Export</span>
                      </h4>
                      <p className="text-[11px] text-emerald-700">Gross $\le$ ₹21,000 | 0.75% EE + 3.25% ER</p>
                    </div>
                    <button
                      onClick={handleDownloadEsic}
                      disabled={statutoryDownloading === 'esic'}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {statutoryDownloading === 'esic' ? 'Downloading...' : 'Download ESIC (.csv)'}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-100 text-center">
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <div className="text-[10px] text-gray-400 font-semibold">Covered Staff</div>
                      <div className="text-xs font-bold text-gray-800">{statutorySummary.esicEligibleCount}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <div className="text-[10px] text-gray-400 font-semibold">Total Wages</div>
                      <div className="text-xs font-bold text-emerald-700">₹{Number(statutorySummary.totalEsicWages || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <div className="text-[10px] text-gray-400 font-semibold">EE (0.75%)</div>
                      <div className="text-xs font-bold text-gray-700">₹{Number(statutorySummary.totalEeEsicContribution || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <div className="text-[10px] text-gray-400 font-semibold">ER (3.25%)</div>
                      <div className="text-xs font-bold text-gray-700">₹{Number(statutorySummary.totalErEsicContribution || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatutoryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variable Pay & Bonus Modal */}
      {showVariablePayModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>💰 Variable Pay, Overtime &amp; Bonuses</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Cycle {selectedRun?.month}/{selectedRun?.year}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add monthly performance incentives, overtime hours, or ad-hoc penalties without modifying base CTC.
                </p>
              </div>
              <button
                onClick={() => setShowVariablePayModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Manual Entry Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!varPayForm.employeeId || !varPayForm.amount) {
                  alert('Please select an employee and enter an amount.');
                  return;
                }
                try {
                  setVarPaySubmitting(true);
                  await addVariablePayEntry({
                    employeeId: parseInt(varPayForm.employeeId, 10),
                    month: selectedRun.month,
                    year: selectedRun.year,
                    type: varPayForm.type,
                    amount: parseFloat(varPayForm.amount),
                    remarks: varPayForm.remarks
                  });
                  setSuccessMsg('Variable pay entry saved! Re-run payroll to apply adjustments.');
                  setVarPayForm({ employeeId: '', type: 'BONUS', amount: '', remarks: '' });
                  const entries = await getVariablePayForMonth(selectedRun.month, selectedRun.year);
                  setVariablePayEntries(entries || []);
                  setTimeout(() => setSuccessMsg(''), 4000);
                } catch (err) {
                  alert(err.message || 'Failed to add variable pay');
                } finally {
                  setVarPaySubmitting(false);
                }
              }}
              className="p-3 bg-gray-50 rounded-xl space-y-3 text-xs"
            >
              <div className="font-semibold text-gray-700">Add Variable Compensation Entry</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  required
                  value={varPayForm.employeeId}
                  onChange={(e) => setVarPayForm({ ...varPayForm, employeeId: e.target.value })}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  <option value="">Select Employee...</option>
                  {records.map((rec) => (
                    <option key={rec.employeeId} value={rec.employeeId}>
                      {rec.employeeName} ({rec.empCode})
                    </option>
                  ))}
                </select>

                <select
                  value={varPayForm.type}
                  onChange={(e) => setVarPayForm({ ...varPayForm, type: e.target.value })}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  <option value="BONUS">Performance Bonus</option>
                  <option value="OVERTIME">Overtime Pay</option>
                  <option value="INCENTIVE">Sales Incentive</option>
                  <option value="DEDUCTION">Ad-hoc Deduction</option>
                </select>

                <input
                  type="number"
                  required
                  min="1"
                  step="100"
                  placeholder="Amount (₹)"
                  value={varPayForm.amount}
                  onChange={(e) => setVarPayForm({ ...varPayForm, amount: e.target.value })}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                />

                <input
                  type="text"
                  placeholder="Remarks / Note"
                  value={varPayForm.remarks}
                  onChange={(e) => setVarPayForm({ ...varPayForm, remarks: e.target.value })}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={varPaySubmitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {varPaySubmitting ? 'Adding...' : '+ Add Entry'}
                </button>
              </div>
            </form>

            {/* CSV Bulk Upload section */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-indigo-900">Bulk Upload CSV:</span>
                <span className="text-gray-500 ml-1">Format: empCode, type, amount, remarks</span>
              </div>
              <label className="cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition">
                <span>Upload CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedRun) return;
                    try {
                      const res = await uploadVariablePayCsv(file, selectedRun.month, selectedRun.year);
                      alert(`Successfully imported ${res.processed} variable pay items! (${res.errors} skipped/errors)`);
                      const entries = await getVariablePayForMonth(selectedRun.month, selectedRun.year);
                      setVariablePayEntries(entries || []);
                    } catch (err) {
                      alert(err.message || 'Failed to import CSV');
                    }
                  }}
                />
              </label>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowVariablePayModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollRunPage;

import { useState, useEffect } from 'react';
import {
  executePayrollRun,
  getAllPayrollRuns,
  getPayrollRecordsForRun,
  reviewPayrollRun,
  approvePayrollRun,
  lockPayrollRun,
  downloadPayslipPdf,
  sendBatchPayslips,
  sendPayslipEmail
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PayrollRecordsTable from '../components/payroll/PayrollRecordsTable';
import BankDisbursalModal from '../components/payroll/BankDisbursalModal';
import StatutoryExportModal from '../components/payroll/StatutoryExportModal';
import VariablePayModal from '../components/payroll/VariablePayModal';
import { formatCurrency } from '../utils/formatters';

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

  // Modals state
  const [showBankModal, setShowBankModal] = useState(false);
  const [showStatutoryModal, setShowStatutoryModal] = useState(false);
  const [showVariablePayModal, setShowVariablePayModal] = useState(false);

  // Email distribution state
  const [emailingBatch, setEmailingBatch] = useState(false);
  const [emailingRecordId, setEmailingRecordId] = useState(null);

  // Selector for new run
  const [month, setMonth] = useState(9);
  const [year, setYear] = useState(2026);

  const { role } = useAuth();

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
      setSuccessMsg(`Payroll calculation completed for ${month}/${year}! Total Net: ${formatCurrency(result.totalNetPay)}`);
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
      <Navbar currentPage="Payroll Engine" />

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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                      Step 3: Lock & Finalize
                    </button>
                  )}

                  {(selectedRun.status === 'APPROVED' || selectedRun.status === 'LOCKED') && (role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                    <>
                      <button
                        onClick={() => setShowBankModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Bank Disbursal
                      </button>
                      <button
                        onClick={() => setShowStatutoryModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                    {formatCurrency(selectedRun.totalGrossPay)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Statutory Deductions</span>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-red-600">
                    {formatCurrency(selectedRun.totalDeductions)}
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <span className="text-xs font-semibold text-indigo-700 uppercase">Total Net Disbursement</span>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-indigo-600">
                    {formatCurrency(selectedRun.totalNetPay)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Records Breakdown Table */}
            <PayrollRecordsTable
              records={records}
              downloadingPdfId={downloadingPdfId}
              emailingRecordId={emailingRecordId}
              onDownloadPayslip={handleDownloadPayslip}
              onSendEmail={handleSendSingleEmail}
            />
          </>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Payroll Runs Yet</h3>
            <p className="text-sm text-gray-400 mb-6">
              Select a month and year above, then click "Run Payroll" to generate your first pay cycle calculation.
            </p>
          </div>
        )}

        {/* Modals */}
        <BankDisbursalModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          selectedRun={selectedRun}
        />

        <StatutoryExportModal
          isOpen={showStatutoryModal}
          onClose={() => setShowStatutoryModal(false)}
          selectedRun={selectedRun}
        />

        <VariablePayModal
          isOpen={showVariablePayModal}
          onClose={() => setShowVariablePayModal(false)}
          selectedRun={selectedRun}
          records={records}
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            setTimeout(() => setSuccessMsg(''), 4000);
          }}
        />
      </div>
    </div>
  );
}

export default PayrollRunPage;

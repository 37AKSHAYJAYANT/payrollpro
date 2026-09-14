import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAttendanceForMonth,
  recordAttendance,
  uploadAttendanceCsv,
  getEmployees
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { downloadBlob } from '../utils/download';
import { MONTH_NAMES } from '../utils/formatters';

function AttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Period Selector
  const [month, setMonth] = useState(9); // September
  const [year, setYear] = useState(2026);

  // Manual Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    totalWorkingDays: 26,
    presentDays: 26,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0
  });
  const [savingManual, setSavingManual] = useState(false);

  // CSV Upload Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const { role, logout } = useAuth();
  const navigate = useNavigate();

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [attData, empData] = await Promise.all([
        getAttendanceForMonth(month, year),
        getEmployees(0, 300)
      ]);
      setAttendances(attData || []);
      setEmployees(empData.content || []);
      if (empData.content && empData.content.length > 0 && !manualForm.employeeId) {
        setManualForm((prev) => ({ ...prev, employeeId: empData.content[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [month, year]);

  async function handleManualSubmit(e) {
    e.preventDefault();
    setSavingManual(true);
    setError('');
    try {
      await recordAttendance({
        ...manualForm,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        employeeId: parseInt(manualForm.employeeId, 10),
        totalWorkingDays: parseInt(manualForm.totalWorkingDays, 10),
        presentDays: parseFloat(manualForm.presentDays),
        paidLeaveDays: parseFloat(manualForm.paidLeaveDays),
        unpaidLeaveDays: parseFloat(manualForm.unpaidLeaveDays)
      });
      setShowManualModal(false);
      setSuccessMsg('Attendance recorded successfully!');
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSavingManual(false);
    }
  }

  async function handleCsvSubmit(e) {
    e.preventDefault();
    if (!csvFile) return;

    setUploading(true);
    setError('');
    setUploadResult(null);
    try {
      const summary = await uploadAttendanceCsv(csvFile, month, year);
      setUploadResult(summary);
      setSuccessMsg(`CSV processed: ${summary.processed} records updated, ${summary.errors} errors.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  }

  function downloadSampleCsv() {
    const header = 'empCode,totalWorkingDays,presentDays,paidLeaves,unpaidLeaves\n';
    const sampleRows = employees.slice(0, 5).map((e) => `${e.empCode},26,24.0,2.0,0.0`).join('\n');
    const blob = new Blob([header + sampleRows], { type: 'text/csv' });
    downloadBlob(blob, `attendance_template_${year}_${month}.csv`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar currentPage="Attendance" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Pay Cycle Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="w-full sm:w-auto px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full sm:w-auto px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button
                onClick={() => setShowManualModal(true)}
                className="w-full sm:w-auto text-center px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg text-xs sm:text-sm transition"
              >
                + Single Entry
              </button>
              <button
                onClick={() => setShowCsvModal(true)}
                className="w-full sm:w-auto text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-sm"
              >
                ↑ Upload Attendance CSV
              </button>
            </div>
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

        {employees.length === 0 && !loading && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold">⚠️ No employees registered in this company workspace.</span>
              <p className="mt-0.5 text-xs text-amber-700">
                You must add employees to your company directory before logging monthly working days and attendance.
              </p>
            </div>
            <Link
              to="/employees"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs whitespace-nowrap text-center"
            >
              + Add First Employee →
            </Link>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase">Records Logged</span>
            <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-gray-900">{attendances.length}</div>
            <div className="mt-1 text-xs text-gray-500">out of {employees.length} active employees</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase">Avg. Payable Days</span>
            <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {attendances.length > 0
                ? (attendances.reduce((acc, a) => acc + parseFloat(a.payableDays || 0), 0) / attendances.length).toFixed(1)
                : '0.0'}
            </div>
            <div className="mt-1 text-xs text-gray-500">days / standard 26</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase">Ready for Payroll</span>
            <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-green-600">
              {attendances.length === employees.length && employees.length > 0 ? '100%' : `${attendances.length} / ${employees.length}`}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {attendances.length === employees.length ? 'All records ready' : 'Auto-filled during payroll if unlogged'}
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">Attendance Log for {month}/{year}</h2>
            <span className="text-xs text-gray-400">{attendances.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-3.5 text-left">Employee</th>
                  <th className="px-6 py-3.5 text-left">Department</th>
                  <th className="px-6 py-3.5 text-center">Working Days</th>
                  <th className="px-6 py-3.5 text-center">Present</th>
                  <th className="px-6 py-3.5 text-center">Paid Leave</th>
                  <th className="px-6 py-3.5 text-center">Unpaid (LOP)</th>
                  <th className="px-6 py-3.5 text-center">Payable Days</th>
                  <th className="px-6 py-3.5 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      Loading attendance...
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No attendance records logged for {month}/{year}. Use "Upload Attendance CSV" or "Single Entry" above.
                    </td>
                  </tr>
                ) : (
                  attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{att.employeeName}</div>
                        <div className="text-xs text-indigo-600 font-semibold">{att.empCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-xs">
                        {att.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-800">
                        {att.totalWorkingDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-green-700 font-medium">
                        {att.presentDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-blue-700">
                        {att.paidLeaveDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-red-700">
                        {att.unpaidLeaveDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-indigo-700">
                        {att.payableDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {att.source}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-bold text-gray-900">Record Employee Attendance</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {employees.length === 0 ? (
                    <option value="" disabled>No employees registered yet</option>
                  ) : (
                    employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.empCode} — {emp.firstName} {emp.lastName} ({emp.department})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Working Days</label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.totalWorkingDays}
                    onChange={(e) => setManualForm({ ...manualForm, totalWorkingDays: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Present Days</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={manualForm.presentDays}
                    onChange={(e) => setManualForm({ ...manualForm, presentDays: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Paid Leaves (Approved)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={manualForm.paidLeaveDays}
                    onChange={(e) => setManualForm({ ...manualForm, paidLeaveDays: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unpaid Leaves (LOP)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={manualForm.unpaidLeaveDays}
                    onChange={(e) => setManualForm({ ...manualForm, unpaidLeaveDays: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg">
                Estimated Payable Days: <span className="font-bold text-indigo-600">
                  {Math.max(0, (parseFloat(manualForm.totalWorkingDays) || 0) - (parseFloat(manualForm.unpaidLeaveDays) || 0))}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual || employees.length === 0}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingManual ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-bold text-gray-900">Upload Attendance CSV for {month}/{year}</h3>
              <button onClick={() => setShowCsvModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleCsvSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-500 transition">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Expected CSV headers: <code className="bg-gray-100 px-1 py-0.5 rounded">empCode, totalWorkingDays, presentDays, paidLeaves, unpaidLeaves</code>
                </p>
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  ⬇ Download Sample CSV Template
                </button>
              </div>

              {uploadResult && (
                <div className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
                  <div className="text-green-700 font-semibold">Processed: {uploadResult.processed}</div>
                  {uploadResult.errors > 0 && (
                    <div className="text-red-600 font-semibold">Errors: {uploadResult.errors}</div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={uploading || !csvFile}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Process CSV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendancePage;

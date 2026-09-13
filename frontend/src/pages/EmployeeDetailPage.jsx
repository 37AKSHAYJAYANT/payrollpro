import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getSalaryStructure,
  saveSalaryStructure,
  calculateFnFPreview,
  saveFnFSettlement,
  getFnFSettlementForEmployee,
  downloadFnFSettlementPdf
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import EmployeeFormModal from '../components/employee/EmployeeFormModal';
import StatusBadge from '../components/common/StatusBadge';

function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // FnF Settlement state
  const [fnfSettlement, setFnfSettlement] = useState(null);
  const [showFnFModal, setShowFnFModal] = useState(false);
  const [fnfLoading, setFnfLoading] = useState(false);
  const [fnfSaving, setFnfSaving] = useState(false);
  const [fnfForm, setFnfForm] = useState({
    resignationDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    lastWorkingDate: new Date().toISOString().split('T')[0],
    noticePeriodDays: 30,
    servedDays: 30,
    otherAdditions: 0,
    otherDeductions: 0,
    remarks: ''
  });
  const [fnfPreview, setFnfPreview] = useState(null);

  // CTC Edit form & Live Preview State
  const [editCtc, setEditCtc] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // Edit Employee State
  const [showEditModal, setShowEditModal] = useState(false);

  function handleOpenEditModal() {
    setShowEditModal(true);
  }

  // Computed breakdown preview (aligned with backend StatutoryRuleEngine)
  const previewBreakdown = () => {
    const ctc = parseFloat(editCtc);
    if (isNaN(ctc) || ctc <= 0) return null;

    const monthlyGross = ctc / 12;
    const basic = monthlyGross * 0.5;
    const hra = basic * 0.4;
    const special = monthlyGross - basic - hra;
    const epf = Math.min(basic * 0.12, 1800);
    const pt = 200;
    const netTakeHome = monthlyGross - epf - pt;

    return {
      monthlyGross: monthlyGross.toFixed(2),
      basic: basic.toFixed(2),
      hra: hra.toFixed(2),
      special: special.toFixed(2),
      epf: epf.toFixed(2),
      pt: pt.toFixed(2),
      netTakeHome: netTakeHome.toFixed(2)
    };
  };

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const empData = await getEmployeeById(id);
      setEmployee(empData);

      try {
        const salData = await getSalaryStructure(id);
        setSalary(salData);
        setEditCtc(salData.annualCTC ? String(salData.annualCTC) : '');
      } catch {
        // Salary may not be configured yet
        setSalary(null);
      }

      try {
        const fnf = await getFnFSettlementForEmployee(id);
        setFnfSettlement(fnf);
      } catch {
        setFnfSettlement(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenFnFModal() {
    setShowFnFModal(true);
    setFnfLoading(true);
    try {
      const preview = await calculateFnFPreview({
        employeeId: Number(id),
        ...fnfForm
      });
      setFnfPreview(preview);
    } catch (err) {
      setError(err.message || 'Failed to calculate settlement preview');
    } finally {
      setFnfLoading(false);
    }
  }

  async function handleFnFFieldChange(field, val) {
    const updated = { ...fnfForm, [field]: val };
    setFnfForm(updated);
    try {
      const preview = await calculateFnFPreview({
        employeeId: Number(id),
        ...updated
      });
      setFnfPreview(preview);
    } catch {}
  }

  async function handleSaveFnF() {
    setFnfSaving(true);
    try {
      const saved = await saveFnFSettlement({
        employeeId: Number(id),
        ...fnfForm
      });
      setFnfSettlement(saved);
      setShowFnFModal(false);
      setSuccessMsg('Full & Final (F&F) Settlement successfully saved and employee marked EXITED!');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to finalize settlement');
    } finally {
      setFnfSaving(false);
    }
  }

  async function handleDownloadFnFStatement() {
    if (!fnfSettlement) return;
    try {
      await downloadFnFSettlementPdf(fnfSettlement.id, `FnF_Settlement_${employee.empCode}.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download statement PDF');
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleSaveSalary(e) {
    e.preventDefault();
    setSavingSalary(true);
    setSuccessMsg('');
    setError('');
    try {
      const ctcValue = parseFloat(editCtc);
      if (isNaN(ctcValue) || ctcValue <= 0) {
        throw new Error('Please enter a valid CTC greater than 0');
      }

      const updated = await saveSalaryStructure(id, { annualCTC: ctcValue });
      setSalary(updated);
      setSuccessMsg('Salary structure updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update salary');
    } finally {
      setSavingSalary(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to mark this employee as EXITED?')) {
      return;
    }
    try {
      await deleteEmployee(id);
      navigate('/employees');
    } catch (err) {
      setError(err.message || 'Failed to exit employee');
    }
  }

  const preview = previewBreakdown();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading employee details...</p>
      </div>
    );
  }

  if (!employee && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <Link to="/employees" className="text-indigo-600 hover:underline">
          ← Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar currentPage="Employee Detail" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Banner with Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg sm:text-2xl">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {employee.empCode}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${
                  employee.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : employee.status === 'ON_LEAVE'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                {employee.designation || 'Designation not set'} • {employee.department} • Joined {employee.dateOfJoining}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              to="/employees"
              className="flex-1 sm:flex-initial text-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              ← Back to List
            </Link>
            {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
              <button
                onClick={handleOpenEditModal}
                className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
                title="Edit employee details"
              >
                <span>✏️</span> Edit Details
              </button>
            )}
            {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && employee.status !== 'EXITED' && (
              <button
                onClick={handleOpenFnFModal}
                className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <span>🚪</span> Process F&amp;F Exit
              </button>
            )}
            {fnfSettlement && (
              <button
                onClick={handleDownloadFnFStatement}
                className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <span>📄</span> Download F&amp;F Statement
              </button>
            )}
            {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && employee.status === 'EXITED' && !fnfSettlement && (
              <button
                onClick={handleOpenFnFModal}
                className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                Calculate F&amp;F Settlement
              </button>
            )}
          </div>
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

        {/* Full & Final Settlement Summary Banner if Exited */}
        {fnfSettlement && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Full &amp; Final Settlement Record
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    {fnfSettlement.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Last working date: <span className="font-semibold">{fnfSettlement.lastWorkingDate}</span> • Service tenure: <span className="font-semibold">{fnfSettlement.completedYearsOfService} completed years</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] text-gray-500 font-semibold uppercase">Net Settlement Payable</div>
                  <div className="text-lg sm:text-xl font-extrabold text-indigo-700">
                    ₹{Number(fnfSettlement.netSettlementAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  onClick={handleDownloadFnFStatement}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  Download Statement
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-purple-200/60 text-xs">
              <div>
                <span className="text-gray-500">Gratuity (Act 1972):</span>
                <div className="font-bold text-gray-800">₹{Number(fnfSettlement.gratuityAmount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-gray-500">EL Encashment ({fnfSettlement.leaveEncashmentDays} days):</span>
                <div className="font-bold text-gray-800">₹{Number(fnfSettlement.leaveEncashmentAmount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-gray-500">Notice Recovery:</span>
                <div className="font-bold text-red-600">- ₹{Number(fnfSettlement.noticeRecoveryAmount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-gray-500">Other Adjustments:</span>
                <div className="font-bold text-gray-800">
                  +₹{Number(fnfSettlement.otherAdditions || 0).toLocaleString('en-IN')} / -₹{Number(fnfSettlement.otherDeductions || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Grid: Left: Personal & Statutory Info, Right: Salary Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Personal, Contact & Bank Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                Employee Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Email Address</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone Number</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Department</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.department}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Designation</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.designation || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Date of Joining</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.dateOfJoining}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Exit Date</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.dateOfExit || '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                Statutory &amp; Bank Details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">PAN Number</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.panNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Aadhaar Number</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.aadhaarNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Bank Name</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.bankName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Account Number</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.bankAccountNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">IFSC Code</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{employee.ifscCode || '—'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right Column: Salary Structure Configuration & Breakdown */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Salary Structure Configuration</h2>
              <p className="text-xs text-gray-500 mb-4">
                Statutory formulas per specs.md: Basic = 50% Gross, HRA = 40% Basic, EPF = 12% Basic, PT = ₹200.
              </p>

              {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') ? (
                <form onSubmit={handleSaveSalary} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual CTC (₹) *
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        ₹
                      </div>
                      <input
                        type="number"
                        step="1000"
                        min="1"
                        required
                        value={editCtc}
                        onChange={(e) => setEditCtc(e.target.value)}
                        placeholder="e.g. 1200000"
                        className="pl-8 w-full px-4 py-2.5 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Auto-preview computed breakdown card */}
                  {preview && (
                    <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 rounded-xl p-4 border border-indigo-100 space-y-2.5">
                      <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Computed Breakdown Preview</span>
                        <span className="text-indigo-600">Monthly Gross: ₹{Number(preview.monthlyGross).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/80 p-2 rounded">
                          <span className="text-gray-500">Basic (50%):</span>
                          <div className="font-bold text-gray-800">₹{Number(preview.basic).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white/80 p-2 rounded">
                          <span className="text-gray-500">HRA (40% Basic):</span>
                          <div className="font-bold text-gray-800">₹{Number(preview.hra).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white/80 p-2 rounded">
                          <span className="text-gray-500">Special Allowance:</span>
                          <div className="font-bold text-gray-800">₹{Number(preview.special).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white/80 p-2 rounded">
                          <span className="text-gray-500">EPF Employee (12%):</span>
                          <div className="font-bold text-red-600">₹{Number(preview.epf).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white/80 p-2 rounded">
                          <span className="text-gray-500">Prof. Tax:</span>
                          <div className="font-bold text-red-600">₹{preview.pt}</div>
                        </div>
                        <div className="bg-indigo-600 text-white p-2 rounded">
                          <span className="text-indigo-200">Est. Net Take Home:</span>
                          <div className="font-bold text-sm">₹{Number(preview.netTakeHome).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingSalary || !editCtc}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
                  >
                    {savingSalary ? 'Saving...' : 'Save Salary Structure'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="text-xl font-bold text-gray-900">
                    Annual CTC: ₹{salary ? Number(salary.annualCTC).toLocaleString('en-IN') : 'Not configured'}
                  </div>
                  {salary && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Monthly Gross:</span> ₹{salary.monthlyGross}</div>
                      <div><span className="text-gray-500">Basic Salary:</span> ₹{salary.basicSalary}</div>
                      <div><span className="text-gray-500">HRA:</span> ₹{salary.hra}</div>
                      <div><span className="text-gray-500">Special Allowance:</span> ₹{salary.specialAllowance}</div>
                      <div><span className="text-gray-500">EPF Deduction:</span> ₹{salary.epfEmployee}</div>
                      <div><span className="text-gray-500">Professional Tax:</span> ₹{salary.professionalTax}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full & Final Settlement Worksheet Modal */}
      {showFnFModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full my-8 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-red-50 to-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center text-lg">
                  🚪
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Full &amp; Final (F&amp;F) Settlement Worksheet
                  </h3>
                  <p className="text-xs text-gray-500">
                    Exit calculation for {employee.firstName} {employee.lastName} ({employee.empCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFnFModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Exit Dates & Notice Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Resignation Date
                  </label>
                  <input
                    type="date"
                    value={fnfForm.resignationDate}
                    onChange={(e) => handleFnFFieldChange('resignationDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Working Date
                  </label>
                  <input
                    type="date"
                    value={fnfForm.lastWorkingDate}
                    onChange={(e) => handleFnFFieldChange('lastWorkingDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Notice Period Required (Days)
                  </label>
                  <input
                    type="number"
                    value={fnfForm.noticePeriodDays}
                    onChange={(e) => handleFnFFieldChange('noticePeriodDays', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Actual Notice Served (Days)
                  </label>
                  <input
                    type="number"
                    value={fnfForm.servedDays}
                    onChange={(e) => handleFnFFieldChange('servedDays', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Other Additions / Reimbursements (₹)
                  </label>
                  <input
                    type="number"
                    value={fnfForm.otherAdditions}
                    onChange={(e) => handleFnFFieldChange('otherAdditions', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Other Deductions / Recoveries (₹)
                  </label>
                  <input
                    type="number"
                    value={fnfForm.otherDeductions}
                    onChange={(e) => handleFnFFieldChange('otherDeductions', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Exit / Settlement Remarks
                </label>
                <textarea
                  rows="2"
                  value={fnfForm.remarks}
                  onChange={(e) => setFnfForm({ ...fnfForm, remarks: e.target.value })}
                  placeholder="e.g. Resigned to pursue higher education, all IT assets returned"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Live Preview Breakdown */}
              {fnfLoading ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full mb-2" />
                  <div>Calculating statutory gratuity and leave balances...</div>
                </div>
              ) : fnfPreview ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-gray-700 uppercase">Statutory &amp; Exit Breakdown</span>
                    <span className="text-gray-500">Service: {fnfPreview.completedYearsOfService} Completed Years</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Statutory Gratuity (Payment of Gratuity Act 1972):
                        {fnfPreview.completedYearsOfService < 5 && <span className="ml-1 text-amber-600 font-semibold">(Tenure &lt; 5 yrs)</span>}
                      </span>
                      <span className="font-semibold text-gray-900">₹{Number(fnfPreview.gratuityAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Earned Leave (EL) Encashment ({fnfPreview.leaveEncashmentDays} days remaining):
                      </span>
                      <span className="font-semibold text-gray-900">₹{Number(fnfPreview.leaveEncashmentAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other Additions / Reimbursements:</span>
                      <span className="font-semibold text-gray-900">+ ₹{Number(fnfPreview.otherAdditions || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {fnfPreview.noticePeriodDays > fnfPreview.servedDays && (
                      <div className="flex justify-between text-red-600">
                        <span>Notice Shortfall Recovery ({fnfPreview.noticePeriodDays - fnfPreview.servedDays} days unserved):</span>
                        <span className="font-semibold">- ₹{Number(fnfPreview.noticeRecoveryAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {fnfPreview.otherDeductions > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Other Recoveries / Deductions:</span>
                        <span className="font-semibold">- ₹{Number(fnfPreview.otherDeductions || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex justify-between items-center text-sm font-extrabold">
                    <span className="text-indigo-900">NET SETTLEMENT PAYABLE:</span>
                    <span className={fnfPreview.netSettlementAmount >= 0 ? 'text-indigo-700' : 'text-red-600'}>
                      ₹{Number(fnfPreview.netSettlementAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFnFModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFnF}
                disabled={fnfSaving || fnfLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {fnfSaving ? 'Processing Exit...' : 'Finalize Settlement & Exit Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mode="edit"
        employee={employee}
        onSave={async (data) => {
          const updated = await updateEmployee(id, data);
          setEmployee(updated);
          setSuccessMsg(`Employee details for ${updated.firstName} ${updated.lastName} updated successfully!`);
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />
    </div>
  );
}

export default EmployeeDetailPage;

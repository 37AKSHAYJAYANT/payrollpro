import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getSalaryStructure,
  saveSalaryStructure
} from '../services/api';
import { useAuth } from '../context/AuthContext';

function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // CTC Edit form & Live Preview State
  const [editCtc, setEditCtc] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // Computed breakdown preview
  const previewBreakdown = () => {
    const ctc = parseFloat(editCtc);
    if (isNaN(ctc) || ctc <= 0) return null;

    const monthlyGross = ctc / 12;
    const basic = monthlyGross * 0.5;
    const hra = basic * 0.4;
    const special = monthlyGross - basic - hra;
    const epf = basic * 0.12;
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
    } catch (err) {
      setError(err.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="text-xl font-bold text-indigo-600">PayrollPro</Link>
              <span className="text-sm text-gray-400">/</span>
              <Link to="/employees" className="text-sm text-gray-600 hover:text-indigo-600">Employees</Link>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">{employee.empCode}</span>
            </div>
            <div className="flex items-center space-x-4">
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
        {/* Banner with Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {employee.empCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  employee.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : employee.status === 'ON_LEAVE'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {employee.designation || 'Designation not set'} • {employee.department} • Joined {employee.dateOfJoining}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/employees"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              ← Back to List
            </Link>
            {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && employee.status !== 'EXITED' && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition"
              >
                Exit Employee
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
    </div>
  );
}

export default EmployeeDetailPage;

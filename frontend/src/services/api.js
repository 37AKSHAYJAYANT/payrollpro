import { downloadBlob } from '../utils/download';
import { getAuthToken } from '../utils/formatters';

// Relative URL ensures requests always route through Vite dev proxy locally and Vercel rewrites in production
const API_BASE = '';

// ---- Core request helper ----
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      try {
        localStorage.removeItem('payrollpro_auth');
        window.dispatchEvent(new Event('payrollpro_auth_logout'));
      } catch {}
    }
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        errorMessage = errorData.errors.map((e) => e.defaultMessage || e.message).filter(Boolean).join(', ') || errorMessage;
      } else {
        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Universal authenticated binary file download helper.
 * Eliminates duplicate fetch, header setup, and blob URL manipulation.
 */
export async function apiDownload(endpoint, defaultFilename = 'download') {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    let msg = `Failed to download file: HTTP ${response.status}`;
    try {
      const err = await response.json();
      msg = err.message || err.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const blob = await response.blob();
  downloadBlob(blob, defaultFilename);
}

// ---- Auth API ----
export async function loginApi(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function registerApi(companyName, adminEmail, password) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ companyName, adminEmail, password })
  });
}

// ---- Employee API ----
export async function getEmployees(page = 0, size = 20, search = '', department = '', status = '') {
  let url = `/api/employees?page=${page}&size=${size}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (department && department !== 'ALL') {
    url += `&department=${encodeURIComponent(department)}`;
  }
  if (status && status !== 'ALL') {
    url += `&status=${encodeURIComponent(status)}`;
  }
  return apiRequest(url);
}

export async function getDepartments() {
  try {
    return await apiRequest('/api/employees/departments');
  } catch {
    return ['Engineering', 'Finance', 'HR', 'Marketing', 'Operations'];
  }
}

export async function getEmployeeById(id) {
  return apiRequest(`/api/employees/${id}`);
}

function sanitizeEmployeeData(employeeData) {
  if (!employeeData || typeof employeeData !== 'object') return employeeData;
  const sanitized = { ...employeeData };
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      sanitized[key] = trimmed === '' ? null : trimmed;
    }
  }
  if (sanitized.panNumber && typeof sanitized.panNumber === 'string') {
    sanitized.panNumber = sanitized.panNumber.toUpperCase();
  }
  if (sanitized.ifscCode && typeof sanitized.ifscCode === 'string') {
    sanitized.ifscCode = sanitized.ifscCode.toUpperCase();
  }
  return sanitized;
}

export async function createEmployee(employeeData) {
  return apiRequest('/api/employees', {
    method: 'POST',
    body: JSON.stringify(sanitizeEmployeeData(employeeData))
  });
}

export async function updateEmployee(id, employeeData) {
  return apiRequest(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sanitizeEmployeeData(employeeData))
  });
}

export async function deleteEmployee(id) {
  return apiRequest(`/api/employees/${id}`, {
    method: 'DELETE'
  });
}

// ---- Salary Structure API ----
export async function getSalaryStructure(employeeId) {
  return apiRequest(`/api/employees/${employeeId}/salary`);
}

export async function saveSalaryStructure(employeeId, salaryData) {
  return apiRequest(`/api/employees/${employeeId}/salary`, {
    method: 'POST',
    body: JSON.stringify(salaryData)
  });
}

export async function previewSalaryStructure(annualCTC) {
  return apiRequest(`/api/salary-structures/preview?annualCTC=${annualCTC}`);
}

// ---- Leave Management API ----
export async function getLeaveTypes() {
  return apiRequest('/api/leaves/types');
}

export async function getMyLeaveBalances() {
  return apiRequest('/api/leaves/my-balance');
}

export async function getMyLeaveRequests() {
  return apiRequest('/api/leaves/my-requests');
}

export async function submitLeaveRequest(data) {
  return apiRequest('/api/leaves/request', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getPendingLeaveRequests() {
  return apiRequest('/api/leaves/pending');
}

export async function getAllLeaveRequests() {
  return apiRequest('/api/leaves/all');
}

export async function approveLeave(id, remarks = '') {
  return apiRequest(`/api/leaves/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ remarks })
  });
}

export async function rejectLeave(id, remarks = '') {
  return apiRequest(`/api/leaves/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ remarks })
  });
}

// ---- Attendance API ----
export async function recordAttendance(data) {
  return apiRequest('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getAttendanceForMonth(month, year) {
  return apiRequest(`/api/attendance?month=${month}&year=${year}`);
}

export async function uploadAttendanceCsv(file, month, year) {
  const token = JSON.parse(localStorage.getItem('payrollpro_auth') || '{}').token;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/attendance/upload-csv?month=${month}&year=${year}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const err = await response.json();
      errorMessage = err.message || err.error || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

// ---- Payroll API ----
export async function executePayrollRun(month, year) {
  return apiRequest(`/api/payroll/run?month=${month}&year=${year}`, {
    method: 'POST'
  });
}

export async function getAllPayrollRuns() {
  return apiRequest('/api/payroll/runs');
}

export async function getPayrollRunById(id) {
  return apiRequest(`/api/payroll/runs/${id}`);
}

export async function getPayrollRecordsForRun(id) {
  return apiRequest(`/api/payroll/runs/${id}/records`);
}

export async function reviewPayrollRun(id) {
  return apiRequest(`/api/payroll/runs/${id}/review`, {
    method: 'PUT'
  });
}

export async function approvePayrollRun(id) {
  return apiRequest(`/api/payroll/runs/${id}/approve`, {
    method: 'PUT'
  });
}

export async function lockPayrollRun(id) {
  return apiRequest(`/api/payroll/runs/${id}/lock`, {
    method: 'PUT'
  });
}

// ---- Payslip API ----
export async function getCurrentUser() {
  return apiRequest('/api/auth/me');
}

export async function getMyPayslips() {
  return apiRequest('/api/payslips/my');
}

export async function getPayslipsForEmployee(employeeId) {
  return apiRequest(`/api/payslips/employee/${employeeId}`);
}

export async function downloadPayslipPdf(recordId, filename = 'payslip.pdf') {
  return apiDownload(`/api/payslips/${recordId}/pdf`, filename);
}

export async function validateBankDisbursal(runId) {
  return apiRequest(`/api/payroll/runs/${runId}/bank-validation`);
}

export async function downloadBankDisbursal(runId, format = 'GENERIC_NEFT') {
  const ext = format === 'HDFC_CMS' ? 'txt' : 'csv';
  const filename = `bank_disbursal_run_${runId}_${format.toLowerCase()}.${ext}`;
  return apiDownload(`/api/payroll/runs/${runId}/bank-export?format=${format}`, filename);
}

// ---- Full & Final (F&F) Settlement API ----
export async function calculateFnFPreview(data) {
  return apiRequest('/api/settlements/calculate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function saveFnFSettlement(data) {
  return apiRequest('/api/settlements', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getAllFnFSettlements() {
  return apiRequest('/api/settlements');
}

export async function getFnFSettlementForEmployee(employeeId) {
  return apiRequest(`/api/settlements/employee/${employeeId}`);
}

export async function approveFnFSettlement(id) {
  return apiRequest(`/api/settlements/${id}/approve`, {
    method: 'PUT'
  });
}

export async function downloadFnFSettlementPdf(id, filename = 'Settlement_Statement.pdf') {
  return apiDownload(`/api/settlements/${id}/statement-pdf`, filename);
}

// ---- Employee Loans & Salary Advances API ----
export async function applyForLoan(data) {
  return apiRequest('/api/loans/apply', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getMyLoans() {
  return apiRequest('/api/loans/my');
}

export async function getLoansForEmployee(employeeId) {
  return apiRequest(`/api/loans/employee/${employeeId}`);
}

export async function getAllLoans() {
  return apiRequest('/api/loans');
}

export async function getPendingLoans() {
  return apiRequest('/api/loans/pending');
}

export async function approveLoan(id) {
  return apiRequest(`/api/loans/${id}/approve`, {
    method: 'PUT'
  });
}

export async function rejectLoan(id) {
  return apiRequest(`/api/loans/${id}/reject`, {
    method: 'PUT'
  });
}

// ---- Statutory Compliance Returns (EPFO & ESIC) API ----
export async function getStatutorySummary(payrollRunId) {
  return apiRequest(`/api/statutory/summary?payrollRunId=${payrollRunId}`);
}

export async function downloadEpfoEcrText(payrollRunId, filename = `EPFO_ECR_Run_${payrollRunId}.txt`) {
  return apiDownload(`/api/statutory/epfo-ecr?payrollRunId=${payrollRunId}`, filename);
}

export async function downloadEsicReturnCsv(payrollRunId, filename = `ESIC_Return_Run_${payrollRunId}.csv`) {
  return apiDownload(`/api/statutory/esic-return?payrollRunId=${payrollRunId}`, filename);
}

// ---- Income Tax Declarations (Form 12BB & Regime) API ----
export async function submitMyTaxDeclaration(data) {
  return apiRequest('/api/tax/declaration', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getMyTaxDeclaration(financialYear = '2026-2027') {
  return apiRequest(`/api/tax/declaration/my?financialYear=${financialYear}`);
}

export async function getPendingTaxDeclarations() {
  return apiRequest('/api/tax/declarations/pending');
}

export async function verifyTaxDeclaration(id, status = 'VERIFIED', remarks = '') {
  return apiRequest(`/api/tax/declarations/${id}/verify?status=${status}&remarks=${encodeURIComponent(remarks)}`, {
    method: 'PUT'
  });
}

// ---- Email Payslip Distribution API ----
export async function sendBatchPayslips(payrollRunId) {
  return apiRequest(`/api/payroll/runs/${payrollRunId}/send-payslips`, {
    method: 'POST'
  });
}

export async function sendPayslipEmail(recordId) {
  return apiRequest(`/api/payroll/records/${recordId}/send-email`, {
    method: 'POST'
  });
}

// ---- Variable Pay, Overtime & Bonus API ----
export async function getVariablePayForMonth(month, year) {
  return apiRequest(`/api/payroll/variable-pay?month=${month}&year=${year}`);
}

export async function addVariablePayEntry(data) {
  return apiRequest('/api/payroll/variable-pay', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteVariablePayEntry(id) {
  return apiRequest(`/api/payroll/variable-pay/${id}`, {
    method: 'DELETE'
  });
}

export async function uploadVariablePayCsv(file, month, year) {
  const token = JSON.parse(localStorage.getItem('payrollpro_auth') || '{}').token;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/payroll/variable-pay/upload-csv?month=${month}&year=${year}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const err = await response.json();
      errorMessage = err.message || err.error || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

// ---- Expense Claims API ----
export async function getExpenseClaims() {
  return apiRequest('/api/expenses');
}

export async function getMyExpenseClaims() {
  return apiRequest('/api/expenses/my');
}

export async function getPendingExpenseClaims() {
  return apiRequest('/api/expenses/pending');
}

export async function submitExpenseClaim(data) {
  return apiRequest('/api/expenses/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function approveExpenseClaim(id, remarks = '') {
  return apiRequest(`/api/expenses/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ remarks })
  });
}

export async function rejectExpenseClaim(id, remarks = '') {
  return apiRequest(`/api/expenses/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ remarks })
  });
}

export { apiRequest };

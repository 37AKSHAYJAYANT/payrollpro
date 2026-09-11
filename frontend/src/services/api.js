const API_BASE = '';

// ---- Core request helper ----
async function apiRequest(endpoint, options = {}) {
  const token = JSON.parse(localStorage.getItem('payrollpro_auth') || '{}').token;

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
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
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
export async function getEmployees(page = 0, size = 20, search = '') {
  let url = `/api/employees?page=${page}&size=${size}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return apiRequest(url);
}

export async function getEmployeeById(id) {
  return apiRequest(`/api/employees/${id}`);
}

export async function createEmployee(employeeData) {
  return apiRequest('/api/employees', {
    method: 'POST',
    body: JSON.stringify(employeeData)
  });
}

export async function updateEmployee(id, employeeData) {
  return apiRequest(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employeeData)
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

  const response = await fetch(`/api/attendance/upload-csv?month=${month}&year=${year}`, {
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
  const token = JSON.parse(localStorage.getItem('payrollpro_auth') || '{}').token;
  const response = await fetch(`/api/payslips/${recordId}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download payslip: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export { apiRequest };

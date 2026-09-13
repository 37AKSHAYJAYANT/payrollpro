import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import LeaveHistoryPage from './pages/LeaveHistoryPage';
import LeaveApprovalPage from './pages/LeaveApprovalPage';
import AttendancePage from './pages/AttendancePage';
import PayrollRunPage from './pages/PayrollRunPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import MyPayslipsPage from './pages/MyPayslipsPage';
import LoanApprovalPage from './pages/LoanApprovalPage';

function RootRoute() {
  const { isAuthenticated, role, initialized } = useAuth();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'EMPLOYEE' ? '/employee/dashboard' : '/dashboard'} replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/payslips" element={<MyPayslipsPage />} />
          <Route path="/my-payslips" element={<MyPayslipsPage />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/leaves" element={<LeaveHistoryPage />} />
          <Route path="/leaves/approvals" element={<LeaveApprovalPage />} />
          <Route path="/loans" element={<LoanApprovalPage />} />
          <Route path="/loans/approvals" element={<LoanApprovalPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/payroll" element={<PayrollRunPage />} />
        </Route>
        <Route path="*" element={<RootRoute />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

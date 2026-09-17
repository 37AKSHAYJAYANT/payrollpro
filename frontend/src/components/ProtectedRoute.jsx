import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutProvider } from '../context/LayoutContext';
import AppLayout from './layout/AppLayout';
import AiCopilot from './AiCopilot';

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, initialized } = useAuth();

  // Guard while auth state is resolving (if applicable)
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-400">403</h1>
          <p className="mt-4 text-xl text-gray-600">Access Denied</p>
          <p className="mt-2 text-gray-400">
            Your role ({role}) does not have permission to access this page.
          </p>
          <a href="/dashboard" className="mt-6 inline-block text-indigo-600 hover:underline">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <LayoutProvider>
      <AppLayout>
        <Outlet />
        {role !== 'EMPLOYEE' && <AiCopilot />}
      </AppLayout>
    </LayoutProvider>
  );
}

export default ProtectedRoute;

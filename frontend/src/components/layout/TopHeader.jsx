import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';

function TopHeader() {
  const { role, companyName, companyId, email, logout } = useAuth();
  const {
    currentPage,
    toggleSidebar,
    sidebarCollapsed,
    toggleMobileSidebar,
  } = useLayout();

  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function getInitials() {
    if (!email) return 'U';
    const namePart = email.split('@')[0];
    const parts = namePart.split(/[._-]/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return namePart.slice(0, 2).toUpperCase();
  }

  function getFormattedName() {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    if (namePart.toLowerCase() === 'hr') return 'HR Admin';
    if (namePart.toLowerCase() === 'admin') return 'Super Admin';
    return namePart
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  function getRoleBadge(r) {
    switch (r) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800' };
      case 'COMPANY_ADMIN':
        return { label: 'Company Admin', bg: 'bg-indigo-100 text-indigo-800' };
      case 'MANAGER':
        return { label: 'Manager', bg: 'bg-emerald-100 text-emerald-800' };
      case 'EMPLOYEE':
        return { label: 'Employee', bg: 'bg-sky-100 text-sky-800' };
      default:
        return { label: r || 'User', bg: 'bg-gray-100 text-gray-700' };
    }
  }

  const roleMeta = getRoleBadge(role);
  const isAdmin = role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Fallback page title based on path if currentPage isn't yet set
  function getComputedTitle() {
    if (currentPage) return currentPage;
    const p = location.pathname;
    if (p === '/dashboard' || p === '/employee/dashboard') return 'Dashboard';
    if (p.startsWith('/employees')) return 'Employee Directory';
    if (p.startsWith('/attendance')) return 'Attendance';
    if (p.startsWith('/payroll')) return 'Payroll Engine';
    if (p.startsWith('/leaves')) return 'Leave Management';
    if (p.startsWith('/loans')) return 'Loans & Advances';
    if (p.startsWith('/expenses')) return 'Expense Claims';
    if (p.startsWith('/employee/payslips') || p.startsWith('/my-payslips')) return 'My Payslips';
    return 'Executive Console';
  }

  return (
    <header className="h-14 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* LEFT: Toggle buttons + Breadcrumbs */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition focus:outline-none"
          aria-label="Open sidebar navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition focus:outline-none"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 truncate">
          <Link to="/dashboard" className="hover:text-indigo-600 transition flex items-center gap-1 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline font-medium">PayrollPro</span>
          </Link>
          <svg className="w-3 h-3 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-bold text-gray-800 truncate text-xs sm:text-sm">
            {getComputedTitle()}
          </span>
        </nav>
      </div>

      {/* RIGHT: Workspace Pill + Action Button + Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Workspace Tag */}
        {companyName && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200/70 max-w-[170px] truncate" title={companyName}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">{companyName}</span>
          </span>
        )}

        {/* Quick Action: New Company (Super Admin only) */}
        {isSuperAdmin && (
          <Link
            to="/register"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200/80 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 transition"
            title="Create a new company workspace"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Company</span>
          </Link>
        )}

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {getInitials()}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
                {getFormattedName()}
              </span>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">{email || 'Authenticated User'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${roleMeta.bg}`}>
                    {roleMeta.label}
                  </span>
                  {companyId && <span className="text-[10px] text-gray-400">ID: #{companyId}</span>}
                </div>
              </div>

              {isSuperAdmin && (
                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/register"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition"
                  >
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Register New Company</span>
                  </Link>
                </div>
              )}

              <div className="border-t border-gray-100 p-1.5 mt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Modern, Interactive Navbar for PayrollPro Enterprise SaaS.
 * Features:
 *  - Active route highlighting with icons
 *  - Interactive Company Switcher popup
 *  - Interactive User Profile & Quick Action Menu
 *  - Clean breadcrumbs with responsive truncating
 *  - Pending approval badges with animations
 *  - Responsive mobile drawer
 */
function Navbar({ currentPage, pendingLeavesCount = 0, pendingLoansCount = 0 }) {
  const { role, companyName, companyId, email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const companyRef = useRef(null);

  // Close dropdowns on outside click or escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(e.target)) {
        setCompanyMenuOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
        setCompanyMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER';

  function isLinkActive(to) {
    if (to === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (to === '/employees') {
      return location.pathname.startsWith('/employees');
    }
    if (to === '/attendance') {
      return location.pathname.startsWith('/attendance');
    }
    if (to === '/payroll') {
      return location.pathname.startsWith('/payroll');
    }
    if (to === '/leaves/approvals' || to === '/leaves') {
      return location.pathname.startsWith('/leaves');
    }
    if (to === '/loans/approvals') {
      return location.pathname.startsWith('/loans');
    }
    if (to === '/employee/payslips') {
      return location.pathname.startsWith('/employee/payslips');
    }
    return location.pathname.startsWith(to);
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

  function getRoleBadge(r) {
    switch (r) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'COMPANY_ADMIN':
        return { label: 'Company Admin', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'MANAGER':
        return { label: 'Manager', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'EMPLOYEE':
        return { label: 'Employee', bg: 'bg-sky-100 text-sky-800 border-sky-200' };
      default:
        return { label: r || 'User', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  }

  const roleMeta = getRoleBadge(role);

  // Desktop links config with inline SVG icons
  const adminLinks = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      to: '/employees',
      label: 'Employees',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      to: '/attendance',
      label: 'Attendance',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      to: '/payroll',
      label: 'Payroll',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      to: '/leaves/approvals',
      label: 'Leaves',
      badge: pendingLeavesCount,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      to: '/loans/approvals',
      label: 'Loans',
      badge: pendingLoansCount,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  const employeeLinks = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      to: '/employee/payslips',
      label: 'My Payslips',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: '/leaves',
      label: 'My Leaves',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  const navLinks = isAdmin ? adminLinks : employeeLinks;

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* LEFT: Logo + Workspace Dropdown + Breadcrumb */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Brand Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
                P
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent hidden sm:inline">
                PayrollPro
              </span>
            </Link>

            {/* Interactive Company Switcher Pill */}
            {companyName && (
              <div className="relative" ref={companyRef}>
                <button
                  type="button"
                  onClick={() => setCompanyMenuOpen(!companyMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100/90 text-gray-700 border border-gray-200/70 hover:bg-gray-200/80 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  title="Click to view workspace details"
                >
                  <span className="text-sm">🏢</span>
                  <span className="max-w-[110px] sm:max-w-[140px] truncate">{companyName}</span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${companyMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Company Dropdown Popup */}
                {companyMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-gray-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Current Workspace</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm mt-1 truncate">{companyName}</p>
                      {companyId && <p className="text-xs text-gray-500">Tenant ID: #{companyId}</p>}
                    </div>

                    <div className="p-2 space-y-1">
                      <Link
                        to="/register"
                        onClick={() => setCompanyMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                      >
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Register New Company</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Breadcrumb current page */}
            {currentPage && (
              <div className="hidden xl:flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-gray-800 truncate max-w-[160px]">
                  {currentPage}
                </span>
              </div>
            )}
          </div>

          {/* CENTER: Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  <span className={active ? 'text-indigo-600' : 'text-gray-400'}>{link.icon}</span>
                  <span>{link.label}</span>
                  {link.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold leading-none shadow-xs animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: User Profile & Quick Actions Menu (Interactive) */}
          <div className="flex items-center gap-2">
            {/* Quick action: Register New Company (Clean mini button for Admin only) */}
            {isAdmin && (
              <Link
                to="/register"
                className="hidden xl:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200/80 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/80 transition"
                title="Create a new company workspace"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Company</span>
              </Link>
            )}

            {/* User Profile Avatar Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-gray-100/80 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-label="User profile menu"
              >
                {/* Initials Avatar */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {getInitials()}
                </div>

                {/* User info (visible on desktop) */}
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                    {email ? email.split('@')[0] : 'User'}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 capitalize">
                    {roleMeta.label}
                  </span>
                </div>

                <svg
                  className={`w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-gray-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Overview Header */}
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {getInitials()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{email || 'Authenticated User'}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${roleMeta.bg}`}>
                          {roleMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Nav Links inside Dropdown */}
                  <div className="p-2 space-y-0.5">
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>Dashboard Overview</span>
                    </Link>

                    {isAdmin ? (
                      <Link
                        to="/employees"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Employee Directory</span>
                      </Link>
                    ) : (
                      <Link
                        to="/employee/payslips"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>My Payslips</span>
                      </Link>
                    )}

                    <Link
                      to="/register"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>+ Register New Company</span>
                    </Link>
                  </div>

                  {/* Sign out section */}
                  <div className="border-t border-gray-100 p-2 mt-1">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
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

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden items-center ml-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-gray-100 transition focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 space-y-2">
            {/* Mobile Company Pill */}
            {companyName && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-semibold text-indigo-900">
                <span className="flex items-center gap-1.5">
                  <span>🏢</span>
                  <span>{companyName}</span>
                </span>
                <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
            )}

            {/* Navigation links */}
            <div className="space-y-1 pt-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={active ? 'text-indigo-600' : 'text-gray-400'}>{link.icon}</span>
                      <span>{link.label}</span>
                    </span>
                    {link.badge > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold leading-none">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Register new company */}
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>+ Register New Company</span>
            </Link>

            {/* Mobile Sign out */}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out ({email || 'User'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

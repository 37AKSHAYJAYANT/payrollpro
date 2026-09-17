import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';

function AppSidebar() {
  const { role, companyName, companyId, email, logout } = useAuth();
  const {
    sidebarCollapsed,
    toggleSidebar,
    pendingLeavesCount,
    pendingLoansCount,
    pendingExpensesCount,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useLayout();

  const location = useLocation();
  const navigate = useNavigate();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const companyMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (companyMenuRef.current && !companyMenuRef.current.contains(e.target)) {
        setCompanyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  function isLinkActive(to) {
    if (to === '/dashboard' || to === '/employee/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/employee/dashboard';
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
    if (to === '/loans/approvals' || to === '/loans') {
      return location.pathname.startsWith('/loans');
    }
    if (to === '/expenses/approvals' || to === '/expenses') {
      return location.pathname.startsWith('/expenses');
    }
    if (to === '/employee/payslips' || to === '/my-payslips') {
      return location.pathname.startsWith('/employee/payslips') || location.pathname.startsWith('/my-payslips');
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

  // Grouped Navigation Structure
  const navigationGroups = isAdmin
    ? [
        {
          groupTitle: 'Overview',
          items: [
            {
              to: '/dashboard',
              label: 'Dashboard',
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ),
            },
          ],
        },
        {
          groupTitle: 'Workforce',
          items: [
            {
              to: '/employees',
              label: 'Employees',
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
            },
            {
              to: '/attendance',
              label: 'Attendance',
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
            },
          ],
        },
        {
          groupTitle: 'Finance & Payroll',
          items: [
            {
              to: '/payroll',
              label: 'Payroll Engine',
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ),
            },
          ],
        },
        {
          groupTitle: 'Approvals & Workflows',
          items: [
            {
              to: '/leaves/approvals',
              label: 'Leaves & Approvals',
              badge: pendingLeavesCount,
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              to: '/loans/approvals',
              label: 'Loans & Advances',
              badge: pendingLoansCount,
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              to: '/expenses/approvals',
              label: 'Expense Claims',
              badge: pendingExpensesCount,
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              ),
            },
          ],
        },
      ]
    : [
        {
          groupTitle: 'Self-Service Portal',
          items: [
            {
              to: '/dashboard',
              label: 'My Dashboard',
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ),
            },
            {
              to: '/employee/payslips',
              label: 'My Payslips',
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              to: '/leaves',
              label: 'My Leaves',
              icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
          ],
        },
      ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white select-none">
      {/* Top section: Brand + Workspace Switcher + Nav Groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105 shrink-0">
              P
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                  PayrollPro
                </span>
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  Enterprise SaaS
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition focus:outline-none"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Workspace Card */}
        {companyName && (
          <div className="relative" ref={companyMenuRef}>
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl border border-gray-200/80 bg-gray-50/70 hover:bg-gray-100/80 hover:border-gray-300 transition focus:outline-none text-left ${
                  sidebarCollapsed ? 'justify-center px-0' : ''
                }`}
                title={sidebarCollapsed ? companyName : 'Switch organization'}
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-sm shrink-0">
                  🏢
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">{companyName}</p>
                    <p className="text-[10px] text-gray-500 truncate">Tenant #{companyId || 1}</p>
                  </div>
                )}
                {!sidebarCollapsed && (
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${companyDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            ) : (
              <div
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl border border-gray-200/80 bg-gray-50/70 select-none ${
                  sidebarCollapsed ? 'justify-center px-0' : ''
                }`}
                title={companyName}
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-sm shrink-0">
                  🏢
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">{companyName}</p>
                    <p className="text-[10px] text-gray-500 truncate">Tenant #{companyId || 1}</p>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown Popup (Super Admin only) */}
            {isSuperAdmin && companyDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-1.5 border-b border-gray-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Workspace</span>
                  <p className="font-bold text-xs text-gray-900 mt-0.5 truncate">{companyName}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/register"
                    onClick={() => setCompanyDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
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

        {/* Grouped Navigation Links */}
        <nav className="space-y-4 pt-1">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {group.groupTitle}
                </p>
              )}
              {group.items.map((item) => {
                const active = isLinkActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    } ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'} transition-colors`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {item.badge > 0 && (
                      <span
                        className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${
                          active
                            ? 'bg-white text-indigo-700'
                            : 'bg-amber-500 text-white animate-pulse'
                        } ${sidebarCollapsed ? 'absolute top-1 right-1' : ''}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer: User Profile & Logout */}
      <div className="p-3 border-t border-gray-100/90 bg-gray-50/50">
        <div className={`flex items-center gap-2.5 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0">
              {getInitials()}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                  {getFormattedName()}
                </p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md ${roleMeta.bg} mt-0.5`}>
                  {roleMeta.label}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
            title="Sign Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 border-r border-gray-200/80 transition-all duration-200 ease-in-out z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Navigation Menu</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AppSidebar;

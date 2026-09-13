import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Shared Navbar component used across all admin/manager pages.
 * Props:
 *  - currentPage: string label for breadcrumb (e.g. "Attendance", "Payroll Engine")
 *  - pendingLeavesCount: number (optional, for badge)
 *  - pendingLoansCount: number (optional, for badge)
 */
function Navbar({ currentPage, pendingLeavesCount = 0, pendingLoansCount = 0 }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER';

  // Admin nav links
  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/employees', label: 'Employees' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/payroll', label: 'Payroll' },
    { to: '/leaves/approvals', label: 'Leaves', badge: pendingLeavesCount },
    { to: '/loans/approvals', label: 'Loans', badge: pendingLoansCount },
  ];

  // Employee nav links
  const employeeLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/leaves', label: 'My Leaves' },
  ];

  const navLinks = isAdmin ? adminLinks : employeeLinks;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo + breadcrumb */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Link to="/dashboard" className="flex items-center space-x-2 shrink-0">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                P
              </span>
              <span className="text-lg sm:text-xl font-bold text-indigo-600">PayrollPro</span>
            </Link>
            {currentPage && (
              <>
                <span className="hidden sm:inline text-sm text-gray-400">/</span>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 truncate">
                  {currentPage}
                </span>
              </>
            )}
          </div>

          {/* Right: Desktop nav links (hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-gray-600 hover:text-indigo-600 transition flex items-center gap-1"
              >
                {link.label}
                {link.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition"
            >
              Sign Out
            </button>
          </div>

          {/* Right: Mobile hamburger button (visible on mobile only) */}
          <div className="flex md:hidden items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-800">
              {role}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-gray-100 transition focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                /* X icon */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {currentPage && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {currentPage}
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition"
              >
                <span>{link.label}</span>
                {link.badge > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

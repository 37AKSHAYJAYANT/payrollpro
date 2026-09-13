import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender
} from '@tanstack/react-table';
import { getEmployees, createEmployee, updateEmployee, getDepartments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const departmentStyles = {
  Engineering: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Marketing: 'bg-purple-50 text-purple-700 border-purple-200',
  Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Operations: 'bg-amber-50 text-amber-700 border-amber-200',
  HR: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusConfig = {
  ACTIVE: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Active'
  },
  ON_LEAVE: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'On Leave'
  },
  EXITED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Exited'
  }
};

const avatarGradients = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-indigo-600'
];

function getAvatarGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function getInitials(first = '', last = '') {
  const f = first ? first.charAt(0) : '';
  const l = last ? last.charAt(0) : '';
  return (f + l).toUpperCase() || 'E';
}

function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [departmentsList, setDepartmentsList] = useState([
    'Engineering', 'Finance', 'HR', 'Marketing', 'Operations'
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    panNumber: '',
    bankName: 'HDFC Bank',
    bankAccountNumber: '',
    ifscCode: ''
  });

  // Edit Employee modal state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    status: 'ACTIVE',
    dateOfJoining: '',
    dateOfBirth: '',
    panNumber: '',
    bankName: 'HDFC Bank',
    bankAccountNumber: '',
    ifscCode: ''
  });
  const [editFormError, setEditFormError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const { role, logout } = useAuth();
  const navigate = useNavigate();

  function handleOpenEditModal(emp) {
    setEditingEmployee(emp);
    setEditFormError('');
    setEditFormData({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || '',
      status: emp.status || 'ACTIVE',
      dateOfJoining: emp.dateOfJoining || new Date().toISOString().split('T')[0],
      dateOfBirth: emp.dateOfBirth || '',
      panNumber: emp.panNumber || '',
      bankName: emp.bankName || 'HDFC Bank',
      bankAccountNumber: emp.bankAccountNumber || '',
      ifscCode: emp.ifscCode || ''
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditFormError('');
    setEditSaving(true);
    try {
      await updateEmployee(editingEmployee.id, editFormData);
      setEditingEmployee(null);
      setSuccessToast(`Employee ${editFormData.firstName} ${editFormData.lastName} updated successfully!`);
      setTimeout(() => setSuccessToast(''), 4000);
      fetchEmployees(page, search, department, status, pageSize);
    } catch (err) {
      setEditFormError(err.message || 'Failed to update employee');
    } finally {
      setEditSaving(false);
    }
  }

  async function fetchEmployees(currentPage = page, currentSearch = search, currentDept = department, currentStatus = status, currentSize = pageSize) {
    setLoading(true);
    setError('');
    try {
      const data = await getEmployees(currentPage, currentSize, currentSearch, currentDept, currentStatus);
      let list = data.content || [];

      // Client-side fallback check (for legacy backend compatibility)
      if (currentDept && currentDept !== 'ALL') {
        const filtered = list.filter(e => e.department && e.department.toLowerCase() === currentDept.toLowerCase());
        if (filtered.length > 0 && filtered.length < list.length) {
          list = filtered;
        }
      }
      if (currentStatus && currentStatus !== 'ALL') {
        const filtered = list.filter(e => e.status === currentStatus);
        if (filtered.length > 0 && filtered.length < list.length) {
          list = filtered;
        }
      }

      setEmployees(list);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }

  // Load distinct departments once on mount
  useEffect(() => {
    async function loadDepts() {
      try {
        const depts = await getDepartments();
        if (Array.isArray(depts) && depts.length > 0) {
          setDepartmentsList(depts);
        }
      } catch {
        // keep default
      }
    }
    loadDepts();
  }, []);

  // Fetch when page, department, status, pageSize change
  useEffect(() => {
    fetchEmployees(page, search, department, status, pageSize);
  }, [page, department, status, pageSize]);

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    setPage(0);
    fetchEmployees(0, search, department, status, pageSize);
  }

  function handleClearSearch() {
    setSearch('');
    setPage(0);
    fetchEmployees(0, '', department, status, pageSize);
  }

  function handleResetAllFilters() {
    setSearch('');
    setDepartment('ALL');
    setStatus('ALL');
    setPage(0);
    fetchEmployees(0, '', 'ALL', 'ALL', pageSize);
  }

  const activeFiltersCount = (department !== 'ALL' ? 1 : 0) + (status !== 'ALL' ? 1 : 0) + (search.trim() ? 1 : 0);

  async function handleAddSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createEmployee(formData);
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: 'Engineering',
        designation: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        panNumber: '',
        bankName: 'HDFC Bank',
        bankAccountNumber: '',
        ifscCode: ''
      });
      fetchEmployees(0, search, department, status, pageSize);
    } catch (err) {
      setFormError(err.message || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  }

  // TanStack table columns definition
  const columns = useMemo(
    () => [
      {
        header: 'Emp Code',
        accessorKey: 'empCode',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-indigo-700 font-mono tracking-tight group-hover:bg-indigo-100 transition">
            {info.getValue()}
          </span>
        )
      },
      {
        header: 'Employee Name',
        id: 'name',
        cell: ({ row }) => {
          const emp = row.original;
          const fullName = `${emp.firstName} ${emp.lastName}`;
          const gradient = getAvatarGradient(fullName);
          const initials = getInitials(emp.firstName, emp.lastName);
          return (
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {fullName}
                </div>
                <div className="text-xs text-gray-400 truncate">{emp.email}</div>
              </div>
            </div>
          );
        }
      },
      {
        header: 'Department',
        accessorKey: 'department',
        cell: (info) => {
          const dept = info.getValue() || 'General';
          const style = departmentStyles[dept] || 'bg-blue-50 text-blue-700 border-blue-200';
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
              {dept}
            </span>
          );
        }
      },
      {
        header: 'Designation',
        accessorKey: 'designation',
        cell: (info) => (
          <span className="text-gray-700 text-xs font-medium">
            {info.getValue() || '—'}
          </span>
        )
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: (info) => {
          const statusVal = info.getValue();
          const cfg = statusConfig[statusVal] || {
            bg: 'bg-gray-100 text-gray-800 border-gray-200',
            dot: 'bg-gray-400',
            label: statusVal
          };
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          );
        }
      },
      {
        header: 'Date of Joining',
        accessorKey: 'dateOfJoining',
        cell: (info) => (
          <span className="text-gray-500 text-xs font-medium">
            {info.getValue() || '—'}
          </span>
        )
      },
      {
        header: 'Actions',
        id: 'action',
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition"
              >
                View &rarr;
              </button>
              {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(emp)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                  title="Edit employee details"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navbar currentPage="Employee Directory" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Header with Title & Add */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Employee Directory</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {totalElements} {totalElements === 1 ? 'Employee' : 'Employees'}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Browse, filter, and manage staff records across all departments
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Employee
              </button>
            )}
          </div>
        </div>

        {successToast && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span className="font-medium">{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast('')}
              className="text-emerald-600 hover:text-emerald-900 font-bold text-lg"
            >
              &times;
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchEmployees(page, search, department, status, pageSize)}
              className="text-xs font-semibold text-red-800 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6 space-y-4">
          {/* Row 1: Search, Department select, Status select, Page size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input (lg: 5 cols) */}
            <div className="lg:col-span-5 relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, code, email, designation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>
            </div>

            {/* Department Dropdown (lg: 3 cols) */}
            <div className="lg:col-span-3">
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {departmentsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Dropdown (lg: 2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">🟢 Active</option>
                <option value="ON_LEAVE">🟡 On Leave</option>
                <option value="EXITED">🔴 Exited</option>
              </select>
            </div>

            {/* Page Size (lg: 2 cols) */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                title="Rows per page"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>

          {/* Row 2: Quick Filter Department Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-xs font-semibold text-gray-400 shrink-0">Quick Department:</span>
            <button
              type="button"
              onClick={() => { setDepartment('ALL'); setPage(0); }}
              className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 ${
                department === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              All
            </button>
            {departmentsList.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDepartment(d); setPage(0); }}
                className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 ${
                  department === d
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Row 3: Active Filter Tags & Reset Button */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 text-xs">
              <span className="font-semibold text-gray-500">Active Filters ({activeFiltersCount}):</span>

              {search.trim() && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Search: &ldquo;{search}&rdquo;
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="hover:text-indigo-900 font-bold ml-0.5"
                    title="Remove filter"
                  >
                    &times;
                  </button>
                </span>
              )}

              {department !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Dept: {department}
                  <button
                    type="button"
                    onClick={() => { setDepartment('ALL'); setPage(0); }}
                    className="hover:text-blue-900 font-bold ml-0.5"
                    title="Remove filter"
                  >
                    &times;
                  </button>
                </span>
              )}

              {status !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Status: {statusConfig[status]?.label || status}
                  <button
                    type="button"
                    onClick={() => { setStatus('ALL'); setPage(0); }}
                    className="hover:text-emerald-900 font-bold ml-0.5"
                    title="Remove filter"
                  >
                    &times;
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-xs text-red-600 hover:text-red-800 font-semibold ml-auto flex items-center gap-1 hover:underline transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* TanStack Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium text-gray-500">Loading directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16 px-4">
                      <div className="max-w-sm mx-auto text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">No employees found</h3>
                        <p className="text-xs text-gray-500">
                          No employee records match your current filter criteria.
                        </p>
                        {activeFiltersCount > 0 && (
                          <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/employees/${row.original.id}`)}
                      className="group hover:bg-indigo-50/60 cursor-pointer transition border-b border-gray-100 last:border-0"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing page <span className="font-semibold">{page + 1}</span> of{' '}
              <span className="font-semibold">{totalPages}</span> ({totalElements} total records)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0 || loading}
                className="px-3.5 py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="px-3.5 py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Joining *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfJoining}
                    onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Statutory &amp; Banking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="HDFC0001234"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>✏️ Edit Employee</span>
                  <span className="font-mono text-sm px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                    {editingEmployee.empCode}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update personal, departmental, and statutory details
                </p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {editFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {editFormError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="ACTIVE">🟢 Active</option>
                    <option value="ON_LEAVE">🟡 On Leave</option>
                    <option value="EXITED">🔴 Exited</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Joining *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.dateOfJoining}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Statutory &amp; Banking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={editFormData.panNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editFormData.bankName}
                      onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={editFormData.bankAccountNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="HDFC0001234"
                      value={editFormData.ifscCode}
                      onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeListPage;

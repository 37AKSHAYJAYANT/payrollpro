import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const DEPARTMENTS = ['Engineering', 'Finance', 'HR', 'Marketing', 'Operations', 'Sales'];
const STATUSES = ['ACTIVE', 'ON_LEAVE', 'EXITED'];

const DEFAULT_FORM_DATA = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: 'Engineering',
  designation: '',
  status: 'ACTIVE',
  dateOfJoining: new Date().toISOString().split('T')[0],
  dateOfBirth: '',
  panNumber: '',
  bankName: 'HDFC Bank',
  bankAccountNumber: '',
  ifscCode: ''
};

/**
 * Reusable Employee Form Modal for Adding and Editing Employees.
 * Eliminates ~350 lines of duplicate JSX markup and form logic across EmployeeListPage and EmployeeDetailPage.
 */
export default function EmployeeFormModal({
  isOpen,
  onClose,
  onSave,
  employee = null,
  mode = 'create'
}) {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (employee) {
        setFormData({
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          email: employee.email || '',
          phone: employee.phone || '',
          department: employee.department || 'Engineering',
          designation: employee.designation || '',
          status: employee.status || 'ACTIVE',
          dateOfJoining: employee.dateOfJoining || '',
          dateOfBirth: employee.dateOfBirth || '',
          panNumber: employee.panNumber || '',
          bankName: employee.bankName || 'HDFC Bank',
          bankAccountNumber: employee.bankAccountNumber || '',
          ifscCode: employee.ifscCode || ''
        });
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
    }
  }, [isOpen, employee]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const sanitized = {
        firstName: formData.firstName ? formData.firstName.trim() : '',
        lastName: formData.lastName ? formData.lastName.trim() : '',
        email: formData.email ? formData.email.trim() : '',
        phone: formData.phone?.trim() ? formData.phone.trim() : null,
        department: formData.department,
        designation: formData.designation?.trim() ? formData.designation.trim() : null,
        status: formData.status || 'ACTIVE',
        dateOfJoining: formData.dateOfJoining,
        dateOfBirth: formData.dateOfBirth?.trim() ? formData.dateOfBirth.trim() : null,
        panNumber: formData.panNumber?.trim() ? formData.panNumber.trim().toUpperCase() : null,
        bankName: formData.bankName?.trim() ? formData.bankName.trim() : null,
        bankAccountNumber: formData.bankAccountNumber?.trim() ? formData.bankAccountNumber.trim() : null,
        ifscCode: formData.ifscCode?.trim() ? formData.ifscCode.trim().toUpperCase() : null
      };
      await onSave(sanitized);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  }

  const title = mode === 'create' ? 'Add New Employee' : `Edit Employee: ${employee?.empCode || ''}`;
  const subtitle = mode === 'create'
    ? 'Fill in profile, employment, and banking details'
    : `Updating profile details for ${employee?.firstName || ''} ${employee?.lastName || ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} maxWidth="max-w-2xl">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
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

        {/* Contact Info */}
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

        {/* Department & Designation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Statutory & Banking Details */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Statutory & Bank Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                maxLength={10}
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg text-sm uppercase focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                placeholder="HDFC0001234"
                maxLength={11}
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg text-sm uppercase focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {mode === 'create' ? (saving ? 'Creating...' : 'Create Employee') : (saving ? 'Saving...' : 'Save Changes')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

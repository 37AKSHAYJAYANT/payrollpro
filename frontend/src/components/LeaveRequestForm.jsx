import { useState } from 'react';
import { submitLeaveRequest } from '../services/api';

function LeaveRequestForm({ leaveTypes, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    leaveTypeId: leaveTypes.length > 0 ? leaveTypes[0].id : '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    isHalfDay: false,
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.leaveTypeId) {
        throw new Error('Please select a leave type');
      }
      await submitLeaveRequest(formData);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Leave Type *</label>
        <select
          value={formData.leaveTypeId}
          onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
        >
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code}) — {t.annualQuota} days/yr
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">From Date *</label>
          <input
            type="date"
            required
            value={formData.fromDate}
            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To Date *</label>
          <input
            type="date"
            required
            value={formData.toDate}
            onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="halfDay"
          checked={formData.isHalfDay}
          onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
        />
        <label htmlFor="halfDay" className="text-xs font-medium text-gray-700 cursor-pointer">
          Apply as Half Day (0.5 day)
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Leave</label>
        <textarea
          rows={3}
          placeholder="Please describe reason for leave..."
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}

export default LeaveRequestForm;

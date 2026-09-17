import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { getVariablePayForMonth, addVariablePayEntry, uploadVariablePayCsv } from '../../services/api';

export default function VariablePayModal({
  isOpen,
  onClose,
  selectedRun,
  records,
  onSuccess
}) {
  const [variablePayEntries, setVariablePayEntries] = useState([]);
  const [variablePayLoading, setVariablePayLoading] = useState(false);
  const [varPayForm, setVarPayForm] = useState({ employeeId: '', type: 'BONUS', amount: '', remarks: '' });
  const [varPaySubmitting, setVarPaySubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && selectedRun) {
      loadEntries();
    }
  }, [isOpen, selectedRun]);

  async function loadEntries() {
    try {
      setVariablePayLoading(true);
      const entries = await getVariablePayForMonth(selectedRun.month, selectedRun.year);
      setVariablePayEntries(entries || []);
    } catch (err) {
      console.error('Failed to load variable pay entries', err);
    } finally {
      setVariablePayLoading(false);
    }
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    if (!varPayForm.employeeId || !varPayForm.amount) {
      alert('Please select an employee and enter an amount.');
      return;
    }
    try {
      setVarPaySubmitting(true);
      await addVariablePayEntry({
        employeeId: parseInt(varPayForm.employeeId, 10),
        month: selectedRun.month,
        year: selectedRun.year,
        type: varPayForm.type,
        amount: parseFloat(varPayForm.amount),
        remarks: varPayForm.remarks
      });
      if (onSuccess) onSuccess('Variable pay entry saved! Re-run payroll to apply adjustments.');
      setVarPayForm({ employeeId: '', type: 'BONUS', amount: '', remarks: '' });
      await loadEntries();
    } catch (err) {
      alert(err.message || 'Failed to add variable pay');
    } finally {
      setVarPaySubmitting(false);
    }
  }

  async function handleCsvUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !selectedRun) return;
    try {
      const res = await uploadVariablePayCsv(file, selectedRun.month, selectedRun.year);
      alert(`Successfully imported ${res.processed} variable pay items! (${res.errors} skipped/errors)`);
      await loadEntries();
    } catch (err) {
      alert(err.message || 'Failed to import CSV');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💰 Variable Pay, Overtime & Bonuses"
      subtitle="Add monthly performance incentives, overtime hours, or ad-hoc penalties without modifying base CTC."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Manual Entry Form */}
        <form onSubmit={handleAddEntry} className="p-3 bg-gray-50 rounded-xl space-y-3 text-xs">
          <div className="font-semibold text-gray-700">Add Variable Compensation Entry</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              required
              value={varPayForm.employeeId}
              onChange={(e) => setVarPayForm({ ...varPayForm, employeeId: e.target.value })}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
            >
              <option value="">Select Employee...</option>
              {records.map((rec) => (
                <option key={rec.employeeId} value={rec.employeeId}>
                  {rec.employeeName} ({rec.empCode})
                </option>
              ))}
            </select>

            <select
              value={varPayForm.type}
              onChange={(e) => setVarPayForm({ ...varPayForm, type: e.target.value })}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
            >
              <option value="BONUS">Performance Bonus</option>
              <option value="OVERTIME">Overtime Pay</option>
              <option value="INCENTIVE">Sales Incentive</option>
              <option value="DEDUCTION">Ad-hoc Deduction</option>
            </select>

            <input
              type="number"
              required
              min="1"
              step="100"
              placeholder="Amount (₹)"
              value={varPayForm.amount}
              onChange={(e) => setVarPayForm({ ...varPayForm, amount: e.target.value })}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
            />

            <input
              type="text"
              placeholder="Remarks / Note"
              value={varPayForm.remarks}
              onChange={(e) => setVarPayForm({ ...varPayForm, remarks: e.target.value })}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={varPaySubmitting}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {varPaySubmitting ? 'Adding...' : '+ Add Entry'}
            </button>
          </div>
        </form>

        {/* CSV Bulk Upload section */}
        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-indigo-900">Bulk Upload CSV:</span>
            <span className="text-gray-500 ml-1">Format: empCode, type, amount, remarks</span>
          </div>
          <label className="cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition">
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
          </label>
        </div>

        <div className="pt-2 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

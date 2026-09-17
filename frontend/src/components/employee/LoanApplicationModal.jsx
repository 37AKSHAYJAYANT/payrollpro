import React, { useState } from 'react';
import Modal from '../common/Modal';
import { applyForLoan } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function LoanApplicationModal({
  isOpen,
  onClose,
  onLoanSubmitted
}) {
  const [loanForm, setLoanForm] = useState({ principalAmount: '', tenureMonths: 6, reason: '' });
  const [loanSubmitting, setLoanSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!loanForm.principalAmount || Number(loanForm.principalAmount) <= 0) {
      alert('Please enter a valid loan amount.');
      return;
    }

    try {
      setLoanSubmitting(true);
      const res = await applyForLoan({
        principalAmount: parseFloat(loanForm.principalAmount),
        tenureMonths: parseInt(loanForm.tenureMonths, 10),
        reason: loanForm.reason
      });
      onLoanSubmitted(res);
      setLoanForm({ principalAmount: '', tenureMonths: 6, reason: '' });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit loan application');
    } finally {
      setLoanSubmitting(false);
    }
  }

  const emiEstimate = loanForm.principalAmount && Number(loanForm.principalAmount) > 0
    ? Number(loanForm.principalAmount) / Number(loanForm.tenureMonths || 1)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Employee Salary Advance / Loan"
      subtitle="Interest-free company advance with automated payroll deduction"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Requested Amount (₹)
          </label>
          <input
            type="number"
            required
            min="1000"
            step="500"
            placeholder="e.g. 50000"
            value={loanForm.principalAmount}
            onChange={(e) => setLoanForm({ ...loanForm, principalAmount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Repayment Tenure (Months)
          </label>
          <select
            value={loanForm.tenureMonths}
            onChange={(e) => setLoanForm({ ...loanForm, tenureMonths: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="1">1 Month (Next Payroll)</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months (1 Year)</option>
            <option value="24">24 Months (2 Years)</option>
          </select>
        </div>

        {emiEstimate > 0 && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
            <div className="flex justify-between items-center text-indigo-900 font-bold">
              <span>Estimated Monthly EMI:</span>
              <span className="text-base text-indigo-700">
                {formatCurrency(emiEstimate)}
              </span>
            </div>
            <p className="text-[11px] text-indigo-600 mt-1">
              Zero percent interest (company advance policy). Deducted automatically every pay period.
            </p>
          </div>
        )}

        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Purpose / Reason
          </label>
          <textarea
            rows={3}
            placeholder="Reason for advance or loan request..."
            value={loanForm.reason}
            onChange={(e) => setLoanForm({ ...loanForm, reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loanSubmitting}
            className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 shadow"
          >
            {loanSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

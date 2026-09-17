import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { submitExpenseClaim, getEmployees } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ExpenseClaimModal({
  isOpen,
  onClose,
  onExpenseSubmitted
}) {
  const { role } = useAuth();
  const isAdmin = role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER';

  const [employees, setEmployees] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    employeeId: '',
    category: 'TRAVEL',
    amount: '',
    merchant: '',
    claimDate: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: ''
  });
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && isAdmin) {
      getEmployees(0, 500)
        .then((res) => {
          const list = res.content || [];
          setEmployees(list);
          if (list.length > 0 && !expenseForm.employeeId) {
            setExpenseForm((prev) => ({ ...prev, employeeId: list[0].id }));
          }
        })
        .catch(() => setEmployees([]));
    }
  }, [isOpen, isAdmin]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    try {
      setExpenseSubmitting(true);
      const payload = {
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        merchant: expenseForm.merchant,
        claimDate: expenseForm.claimDate,
        description: expenseForm.description,
        receiptUrl: expenseForm.receiptUrl
      };
      if (isAdmin && expenseForm.employeeId) {
        payload.employeeId = Number(expenseForm.employeeId);
      }
      const res = await submitExpenseClaim(payload);
      onExpenseSubmitted(res);
      setExpenseForm({
        category: 'TRAVEL',
        amount: '',
        merchant: '',
        claimDate: new Date().toISOString().split('T')[0],
        description: '',
        receiptUrl: ''
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit expense claim');
    } finally {
      setExpenseSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Expense Claim"
      subtitle="Non-taxable reimbursement processed via payroll"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {isAdmin && (
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={expenseForm.employeeId}
              onChange={(e) => setExpenseForm({ ...expenseForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs bg-white font-medium"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.empCode}) • {emp.department}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs bg-white"
            >
              <option value="TRAVEL">Travel / Cab / Flight</option>
              <option value="MEALS">Client Meals / Dining</option>
              <option value="BROADBAND">Broadband / Internet</option>
              <option value="FUEL">Fuel / Petrol</option>
              <option value="OTHER">Other Business Expense</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Claim Date
            </label>
            <input
              type="date"
              required
              value={expenseForm.claimDate}
              onChange={(e) => setExpenseForm({ ...expenseForm, claimDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="e.g. 1500"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Vendor / Merchant
            </label>
            <input
              type="text"
              placeholder="e.g. Uber / Airtel / Cafe"
              value={expenseForm.merchant}
              onChange={(e) => setExpenseForm({ ...expenseForm, merchant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Description / Business Purpose
          </label>
          <textarea
            rows={2}
            placeholder="Provide details about the business expense..."
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Receipt URL / Invoice Reference (Optional)
          </label>
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={expenseForm.receiptUrl}
            onChange={(e) => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
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
            disabled={expenseSubmitting}
            className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50 shadow"
          >
            {expenseSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

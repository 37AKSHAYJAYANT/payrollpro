import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { submitMyTaxDeclaration } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function TaxDeclarationModal({
  isOpen,
  onClose,
  initialTaxDecl,
  onTaxSubmitted
}) {
  const [taxForm, setTaxForm] = useState({
    financialYear: '2024-2025',
    regime: 'NEW_REGIME',
    section80C: '',
    section80D: '',
    section24HomeLoan: '',
    annualRentPaid: '',
    isMetro: false,
    otherExemptions: ''
  });
  const [taxSubmitting, setTaxSubmitting] = useState(false);
  const [taxDecl, setTaxDecl] = useState(initialTaxDecl || null);

  useEffect(() => {
    if (initialTaxDecl) {
      setTaxDecl(initialTaxDecl);
      setTaxForm((prev) => ({
        ...prev,
        financialYear: initialTaxDecl.financialYear || prev.financialYear,
        regime: initialTaxDecl.regime || 'NEW_REGIME',
        section80C: initialTaxDecl.section80C != null ? String(initialTaxDecl.section80C) : '',
        section80D: initialTaxDecl.section80D != null ? String(initialTaxDecl.section80D) : '',
        section24HomeLoan: initialTaxDecl.section24HomeLoan != null ? String(initialTaxDecl.section24HomeLoan) : '',
        annualRentPaid: initialTaxDecl.annualRentPaid != null ? String(initialTaxDecl.annualRentPaid) : '',
        isMetro: Boolean(initialTaxDecl.isMetro),
        otherExemptions: initialTaxDecl.otherExemptions != null ? String(initialTaxDecl.otherExemptions) : ''
      }));
    }
  }, [initialTaxDecl]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setTaxSubmitting(true);
      const res = await submitMyTaxDeclaration({
        financialYear: taxForm.financialYear,
        regime: taxForm.regime,
        section80C: taxForm.section80C ? parseFloat(taxForm.section80C) : 0,
        section80D: taxForm.section80D ? parseFloat(taxForm.section80D) : 0,
        section24HomeLoan: taxForm.section24HomeLoan ? parseFloat(taxForm.section24HomeLoan) : 0,
        annualRentPaid: taxForm.annualRentPaid ? parseFloat(taxForm.annualRentPaid) : 0,
        isMetro: taxForm.isMetro,
        otherExemptions: taxForm.otherExemptions ? parseFloat(taxForm.otherExemptions) : 0
      });
      setTaxDecl(res);
      onTaxSubmitted(res);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit tax declaration');
    } finally {
      setTaxSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Income Tax Declaration (Form 12BB)"
      subtitle="Choose tax regime & claim Chapter VI-A statutory deductions"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Tax Regime Selector */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Tax Regime</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTaxForm({ ...taxForm, regime: 'NEW_REGIME' })}
              className={`p-3 rounded-xl border text-left transition ${
                taxForm.regime === 'NEW_REGIME'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900">New Regime (Sec 115BAC)</div>
              <p className="text-[11px] text-gray-500 mt-1">Lower tax slabs, ₹75,000 std deduction, no exemptions</p>
            </button>

            <button
              type="button"
              onClick={() => setTaxForm({ ...taxForm, regime: 'OLD_REGIME' })}
              className={`p-3 rounded-xl border text-left transition ${
                taxForm.regime === 'OLD_REGIME'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900">Old Regime</div>
              <p className="text-[11px] text-gray-500 mt-1">Traditional slabs with 80C, 80D, HRA & Home Loan deductions</p>
            </button>
          </div>
        </div>

        {taxForm.regime === 'OLD_REGIME' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Section 80C (Max ₹1.5 Lakh)
                </label>
                <input
                  type="number"
                  placeholder="PPF, ELSS, Life Insurance"
                  value={taxForm.section80C}
                  onChange={(e) => setTaxForm({ ...taxForm, section80C: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Section 80D Mediclaim (Max ₹75K)
                </label>
                <input
                  type="number"
                  placeholder="Health insurance premium"
                  value={taxForm.section80D}
                  onChange={(e) => setTaxForm({ ...taxForm, section80D: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Section 24 Home Loan Interest
                </label>
                <input
                  type="number"
                  placeholder="Max ₹2,00,000"
                  value={taxForm.section24HomeLoan}
                  onChange={(e) => setTaxForm({ ...taxForm, section24HomeLoan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Annual Rent Paid (for HRA)
                </label>
                <input
                  type="number"
                  placeholder="Total rent paid in year"
                  value={taxForm.annualRentPaid}
                  onChange={(e) => setTaxForm({ ...taxForm, annualRentPaid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isMetro"
                checked={taxForm.isMetro}
                onChange={(e) => setTaxForm({ ...taxForm, isMetro: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isMetro" className="text-gray-700">
                Rented accommodation is in a Metro city (Delhi, Mumbai, Kolkata, Chennai - 50% basic rule)
              </label>
            </div>
          </div>
        )}

        {taxDecl?.projectedAnnualTax != null && (
          <div className="p-3 bg-indigo-50 rounded-xl flex justify-between items-center text-xs">
            <div>
              <div className="font-semibold text-indigo-900">Projected Annual Income Tax:</div>
              <div className="text-[11px] text-indigo-600">
                Monthly TDS deduction: {formatCurrency(taxDecl.monthlyTds || 0)}
              </div>
            </div>
            <div className="text-base font-extrabold text-indigo-700">
              {formatCurrency(taxDecl.projectedAnnualTax)}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={taxSubmitting}
            className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 shadow"
          >
            {taxSubmitting ? 'Saving Declaration...' : 'Save & Submit Form 12BB'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

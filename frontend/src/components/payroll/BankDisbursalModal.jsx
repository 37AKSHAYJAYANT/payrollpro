import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { validateBankDisbursal, downloadBankDisbursal } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function BankDisbursalModal({
  isOpen,
  onClose,
  selectedRun
}) {
  const [bankFormat, setBankFormat] = useState('GENERIC_NEFT');
  const [bankValidation, setBankValidation] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankExporting, setBankExporting] = useState(false);

  useEffect(() => {
    if (isOpen && selectedRun) {
      loadValidation(selectedRun.id);
    }
  }, [isOpen, selectedRun]);

  async function loadValidation(runId) {
    try {
      setBankLoading(true);
      const val = await validateBankDisbursal(runId);
      setBankValidation(val);
    } catch (err) {
      alert(err.message || 'Validation failed');
    } finally {
      setBankLoading(false);
    }
  }

  async function handleExportBankFile() {
    if (!selectedRun) return;
    try {
      setBankExporting(true);
      await downloadBankDisbursal(selectedRun.id, bankFormat);
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setBankExporting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🏦 Bank Disbursal Export"
      subtitle="Corporate banking batch payment upload file"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Format selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Select Corporate Bank Profile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'GENERIC_NEFT', label: 'Generic NEFT', desc: 'Standard CSV file' },
              { id: 'HDFC_CMS', label: 'HDFC Bank CMS', desc: 'Pipe-delimited upload' },
              { id: 'ICICI_CIB', label: 'ICICI Bank CIB', desc: 'Corporate template' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setBankFormat(fmt.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  bankFormat === fmt.id
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold text-gray-900">{fmt.label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{fmt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pre-flight validation summary */}
        {bankLoading ? (
          <div className="p-6 text-center text-xs text-gray-500">
            <div className="animate-spin inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mb-2" />
            <div>Validating bank accounts and IFSC codes...</div>
          </div>
        ) : bankValidation ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <div className="text-[11px] text-gray-400 uppercase font-semibold">Total Records</div>
                <div className="text-base font-bold text-gray-800">{bankValidation.totalRecords}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center">
                <div className="text-[11px] text-emerald-700 uppercase font-semibold">Valid Payouts</div>
                <div className="text-base font-bold text-emerald-600">{bankValidation.validRecords}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-center">
                <div className="text-[11px] text-amber-700 uppercase font-semibold">Flagged / Invalid</div>
                <div className="text-base font-bold text-amber-600">{bankValidation.invalidRecords}</div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl flex items-center justify-between text-xs">
              <span className="font-medium text-indigo-900">Total Net Disbursal:</span>
              <span className="font-extrabold text-indigo-700 text-sm">
                {formatCurrency(bankValidation.totalPayout || 0)}
              </span>
            </div>

            {bankValidation.errors && bankValidation.errors.length > 0 && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 max-h-28 overflow-y-auto">
                <div className="font-semibold text-amber-900 flex items-center gap-1">
                  ⚠️ Pre-Flight Warnings ({bankValidation.errors.length}):
                </div>
                {bankValidation.errors.slice(0, 4).map((err, idx) => (
                  <div key={idx} className="text-amber-800 text-[11px]">
                    • <span className="font-mono font-medium">{err.empCode}</span>: {err.issue}
                  </div>
                ))}
                {bankValidation.errors.length > 4 && (
                  <div className="text-[10px] text-amber-700 italic">
                    +{bankValidation.errors.length - 4} more warnings in run...
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleExportBankFile}
            disabled={bankExporting || bankLoading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {bankExporting ? 'Exporting File...' : 'Download Bank Disbursal File'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

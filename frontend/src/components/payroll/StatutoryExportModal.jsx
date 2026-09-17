import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { getStatutorySummary, downloadEpfoEcrText, downloadEsicReturnCsv } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function StatutoryExportModal({
  isOpen,
  onClose,
  selectedRun
}) {
  const [statutorySummary, setStatutorySummary] = useState(null);
  const [statutoryLoading, setStatutoryLoading] = useState(false);
  const [statutoryDownloading, setStatutoryDownloading] = useState(null);

  useEffect(() => {
    if (isOpen && selectedRun) {
      loadSummary(selectedRun.id);
    }
  }, [isOpen, selectedRun]);

  async function loadSummary(runId) {
    try {
      setStatutoryLoading(true);
      const summary = await getStatutorySummary(runId);
      setStatutorySummary(summary);
    } catch (err) {
      alert(err.message || 'Failed to load statutory summary');
    } finally {
      setStatutoryLoading(false);
    }
  }

  async function handleDownloadEcr() {
    if (!selectedRun) return;
    try {
      setStatutoryDownloading('ecr');
      await downloadEpfoEcrText(selectedRun.id);
    } catch (err) {
      alert(err.message || 'Download ECR failed');
    } finally {
      setStatutoryDownloading(null);
    }
  }

  async function handleDownloadEsic() {
    if (!selectedRun) return;
    try {
      setStatutoryDownloading('esic');
      await downloadEsicReturnCsv(selectedRun.id);
    } catch (err) {
      alert(err.message || 'Download ESIC failed');
    } finally {
      setStatutoryDownloading(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🏛️ Statutory Returns & Government Filings"
      subtitle="Pre-formatted official filing exports for EPFO unified portal & ESIC contribution returns"
      maxWidth="max-w-xl"
    >
      {statutoryLoading ? (
        <div className="py-8 text-center text-xs text-gray-500 space-y-2">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          <div>Calculating statutory contributions & wage ceilings...</div>
        </div>
      ) : statutorySummary ? (
        <div className="space-y-4 text-xs">
          {/* EPFO Section */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                  <span>EPFO Electronic Challan cum Return (ECR)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200 text-blue-800">#~# Delimited</span>
                </h4>
                <p className="text-[11px] text-blue-700">Wage ceiling ₹15,000 | 12% EE + 8.33% EPS + 3.67% ER</p>
              </div>
              <button
                onClick={handleDownloadEcr}
                disabled={statutoryDownloading === 'ecr'}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {statutoryDownloading === 'ecr' ? 'Downloading...' : 'Download ECR (.txt)'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-100 text-center">
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <div className="text-[10px] text-gray-400 font-semibold">Eligible Staff</div>
                <div className="text-xs font-bold text-gray-800">{statutorySummary.epfEligibleCount}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <div className="text-[10px] text-gray-400 font-semibold">EPF Wages</div>
                <div className="text-xs font-bold text-blue-700">{formatCurrency(statutorySummary.totalEpfWages || 0)}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <div className="text-[10px] text-gray-400 font-semibold">EE Share (12%)</div>
                <div className="text-xs font-bold text-emerald-700">{formatCurrency(statutorySummary.totalEeEpfContribution || 0)}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <div className="text-[10px] text-gray-400 font-semibold">EPS Share (8.33%)</div>
                <div className="text-xs font-bold text-purple-700">{formatCurrency(statutorySummary.totalEpsContribution || 0)}</div>
              </div>
            </div>
          </div>

          {/* ESIC Section */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <span>ESIC Monthly Return of Contribution</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">CSV Export</span>
                </h4>
                <p className="text-[11px] text-emerald-700">Gross &le; ₹21,000 | 0.75% EE + 3.25% ER</p>
              </div>
              <button
                onClick={handleDownloadEsic}
                disabled={statutoryDownloading === 'esic'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {statutoryDownloading === 'esic' ? 'Downloading...' : 'Download ESIC (.csv)'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-100 text-center">
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-gray-400 font-semibold">Covered Staff</div>
                <div className="text-xs font-bold text-gray-800">{statutorySummary.esicEligibleCount}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-gray-400 font-semibold">Total Wages</div>
                <div className="text-xs font-bold text-emerald-700">{formatCurrency(statutorySummary.totalEsicWages || 0)}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-gray-400 font-semibold">EE (0.75%)</div>
                <div className="text-xs font-bold text-gray-700">{formatCurrency(statutorySummary.totalEeEsicContribution || 0)}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-gray-400 font-semibold">ER (3.25%)</div>
                <div className="text-xs font-bold text-gray-700">{formatCurrency(statutorySummary.totalErEsicContribution || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pt-3 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

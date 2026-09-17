import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Modal from '../components/common/Modal';
import { getMyPayslips, downloadPayslipPdf } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function MyPayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchYear, setSearchYear] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const pData = await getMyPayslips();
        setPayslips(pData || []);
      } catch (err) {
        setError(err.message || 'Failed to load payslips');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDownload(record) {
    try {
      setDownloadingId(record.id);
      await downloadPayslipPdf(record.id, `Payslip-${record.payslipRef || record.id}.pdf`);
    } catch (err) {
      alert(err.message || 'Error downloading PDF');
    } finally {
      setDownloadingId(null);
    }
  }

  const filteredPayslips = payslips.filter((p) => {
    if (searchYear !== 'ALL' && p.year !== parseInt(searchYear, 10)) {
      return false;
    }
    return true;
  });

  const uniqueYears = Array.from(new Set(payslips.map((p) => p.year))).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Navigation */}
      <Navbar currentPage="My Payslips" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">My Payslip Statements</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Access and download verified monthly salary slips with statutory breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">Year:</label>
            <select
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white font-medium text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Years</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-500">Loading payslip archive...</div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No payslips found for this selection.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Pay Period</th>
                    <th className="px-6 py-4 font-semibold">Reference</th>
                    <th className="px-6 py-4 font-semibold text-right">Attendance</th>
                    <th className="px-6 py-4 font-semibold text-right">Gross Earnings</th>
                    <th className="px-6 py-4 font-semibold text-right">Deductions</th>
                    <th className="px-6 py-4 font-semibold text-right">Net Pay</th>
                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayslips.map((r) => (
                    <tr key={r.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {r.month}/{r.year}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {r.payslipRef}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-600">
                        <span className="font-bold text-gray-900">{r.payableDays}</span> / {r.totalWorkingDays} days
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(r.grossEarned)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">
                        {formatCurrency(r.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-indigo-700">
                        {formatCurrency(r.netPay)}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          View Breakdown
                        </button>
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {downloadingId === r.id ? 'Generating...' : 'Download PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Breakdown Modal */}
        <Modal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord ? `Payslip Breakdown — ${selectedRecord.month}/${selectedRecord.year}` : ''}
          subtitle={selectedRecord ? `Ref: ${selectedRecord.payslipRef}` : ''}
          maxWidth="max-w-2xl"
        >
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Earnings breakdown */}
                <div className="bg-green-50/50 p-3.5 sm:p-4 rounded-xl border border-green-200/60 space-y-2">
                  <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider">Earnings</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Basic Salary:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedRecord.basicEarned)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">HRA:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedRecord.hraEarned)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Special Allowance:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedRecord.specialAllowanceEarned)}</span>
                  </div>
                  <div className="pt-2 border-t border-green-200 flex justify-between text-xs font-bold text-green-900">
                    <span>Total Gross:</span>
                    <span>{formatCurrency(selectedRecord.grossEarned)}</span>
                  </div>
                </div>

                {/* Deductions breakdown */}
                <div className="bg-red-50/50 p-3.5 sm:p-4 rounded-xl border border-red-200/60 space-y-2">
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Deductions</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">EPF (Employee):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedRecord.epfDeduction)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Professional Tax:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedRecord.professionalTax)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">TDS (Income Tax):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedRecord.tdsDeduction)}</span>
                  </div>
                  <div className="pt-2 border-t border-red-200 flex justify-between text-xs font-bold text-red-900">
                    <span>Total Deductions:</span>
                    <span>{formatCurrency(selectedRecord.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="bg-indigo-50 p-3.5 sm:p-4 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-indigo-700 font-medium">Net Take-Home Salary</div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-950">
                    {formatCurrency(selectedRecord.netPay)}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedRecord)}
                  disabled={downloadingId === selectedRecord.id}
                  className="w-full sm:w-auto text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {downloadingId === selectedRecord.id ? 'Generating...' : 'Download Official PDF'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}

export default MyPayslipsPage;

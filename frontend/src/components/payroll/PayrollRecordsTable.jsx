import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function PayrollRecordsTable({
  records,
  downloadingPdfId,
  emailingRecordId,
  onDownloadPayslip,
  onSendEmail
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm sm:text-base">Employee Breakdown Records</h3>
        <span className="text-xs text-gray-400">{records.length} line items</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3.5 text-left">Employee</th>
              <th className="px-6 py-3.5 text-center">Payable / Working</th>
              <th className="px-6 py-3.5 text-right">Basic Earned</th>
              <th className="px-6 py-3.5 text-right">Gross Earned</th>
              <th className="px-6 py-3.5 text-right">EPF</th>
              <th className="px-6 py-3.5 text-right">PT</th>
              <th className="px-6 py-3.5 text-right">TDS</th>
              <th className="px-6 py-3.5 text-right">Total Deductions</th>
              <th className="px-6 py-3.5 text-right">Net Pay</th>
              <th className="px-6 py-3.5 text-center">Status</th>
              <th className="px-6 py-3.5 text-center">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {records.map((r) => (
              <tr
                key={r.id}
                className={`transition ${r.isAnomaly ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50/70'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{r.employeeName}</div>
                  <div className="text-xs text-indigo-600 font-semibold">{r.empCode} • {r.department}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                  <span className="font-bold text-gray-900">{r.payableDays}</span> / {r.totalWorkingDays}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                  {formatCurrency(r.basicEarned)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                  {formatCurrency(r.grossEarned)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 text-xs">
                  {formatCurrency(r.epfDeduction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 text-xs">
                  ₹{r.professionalTax}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 text-xs">
                  {formatCurrency(r.tdsDeduction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-red-600">
                  {formatCurrency(r.totalDeductions)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-extrabold text-indigo-600">
                  {formatCurrency(r.netPay)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {r.isAnomaly ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      Anomaly
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Valid
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onDownloadPayslip(r)}
                    disabled={downloadingPdfId === r.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    title="Download Payslip PDF"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {downloadingPdfId === r.id ? '...' : 'PDF'}
                  </button>
                  <button
                    onClick={() => onSendEmail(r)}
                    disabled={emailingRecordId === r.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 ml-1.5"
                    title="Email Encrypted Payslip to Employee"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {emailingRecordId === r.id ? '...' : 'Email'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

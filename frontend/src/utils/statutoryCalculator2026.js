/**
 * Standalone 2026 Statutory & EPFO Calculation Engine (Frontend).
 * Pure JavaScript utility providing zero-latency reactive calculation of Indian payroll statutory components.
 * Matches backend StatutoryCalculator2026.java exactly.
 */

// 2026 Statutory Constants
export const STATUTORY_2026 = {
  BASIC_PERCENT: 0.50,
  HRA_PERCENT: 0.40,
  EPF_WAGE_CEILING: 15000,
  EE_EPF_RATE: 0.12,
  MAX_EE_EPF_MONTHLY: 1800,
  ER_EPS_RATE: 25 / 300, // 8 1/3% (exact 1/12)
  MAX_ER_EPS_MONTHLY: 1250,
  MAX_ER_EPF_MONTHLY: 550,
  EDLI_RATE: 0.0050,
  MAX_EDLI_MONTHLY: 75,
  EPF_ADMIN_RATE: 0.0050,
  MAX_EPF_ADMIN_MONTHLY: 75,
  TOTAL_ER_EPFO_MAX: 1950,
  TOTAL_EPFO_REMITTANCE_MAX: 3750,
  DEFAULT_PROFESSIONAL_TAX: 200,
  STANDARD_DEDUCTION: 75000, // Budget 2024 / 2026 New Tax Regime
  SEC_87A_CEILING: 700000,
  CESS_RATE: 0.04
};

/**
 * Computes the complete 2026 statutory breakdown for an annual CTC.
 *
 * @param {number|string} annualCTC - Annual Cost to Company
 * @param {object} options - Optional overrides (customPT, customTds)
 * @returns {object} Complete itemized statutory metrics
 */
export function calculateStatutory2026(annualCTC, options = {}) {
  const ctc = parseFloat(annualCTC) || 0;
  if (ctc <= 0) {
    return null;
  }

  // 1. Earnings Breakdown
  const monthlyGross = Math.round((ctc / 12) * 100) / 100;
  const basicSalary = Math.round((monthlyGross * STATUTORY_2026.BASIC_PERCENT) * 100) / 100;
  const hra = Math.round((basicSalary * STATUTORY_2026.HRA_PERCENT) * 100) / 100;
  const specialAllowance = Math.max(0, Math.round((monthlyGross - basicSalary - hra) * 100) / 100);

  // 2. EPFO Breakdown (Statutory ₹15,000 wage ceiling)
  const epfWage = Math.min(basicSalary, STATUTORY_2026.EPF_WAGE_CEILING);
  const employeeEpf = Math.min(Math.round(epfWage * STATUTORY_2026.EE_EPF_RATE), STATUTORY_2026.MAX_EE_EPF_MONTHLY);
  const employerEps = Math.min(Math.round(epfWage * STATUTORY_2026.ER_EPS_RATE), STATUTORY_2026.MAX_ER_EPS_MONTHLY);
  const employerEpf = Math.min(Math.max(0, employeeEpf - employerEps), STATUTORY_2026.MAX_ER_EPF_MONTHLY);
  const edliEmployer = Math.min(Math.round(epfWage * STATUTORY_2026.EDLI_RATE), STATUTORY_2026.MAX_EDLI_MONTHLY);
  const epfAdminEmployer = Math.min(Math.round(epfWage * STATUTORY_2026.EPF_ADMIN_RATE), STATUTORY_2026.MAX_EPF_ADMIN_MONTHLY);
  const totalEmployerCost = employerEpf + employerEps + edliEmployer + epfAdminEmployer;
  const totalEpfoRemittance = employeeEpf + totalEmployerCost;

  // 3. Professional Tax
  const professionalTax = options.customPT !== undefined ? Number(options.customPT) : STATUTORY_2026.DEFAULT_PROFESSIONAL_TAX;

  // 4. 2026 Income Tax / TDS (New Tax Regime)
  const annualGross = monthlyGross * 12;
  const tdsMetrics = calculateTds2026(annualGross);
  const monthlyTds = (options.customTds !== undefined && options.customTds !== null && options.customTds > 0)
    ? Number(options.customTds)
    : tdsMetrics.monthlyTds;

  // 5. Net Take Home Pay
  const netTakeHome = Math.round((monthlyGross - employeeEpf - professionalTax - monthlyTds) * 100) / 100;

  return {
    annualCTC: ctc,
    monthlyGross,
    basicSalary,
    hra,
    specialAllowance,
    epfWage,
    employeeEpf,
    employerEps,
    employerEpf,
    edliEmployer,
    epfAdminEmployer,
    totalEmployerCost,
    totalEpfoRemittance,
    professionalTax,
    standardDeduction: STATUTORY_2026.STANDARD_DEDUCTION,
    taxableIncome: tdsMetrics.taxableIncome,
    annualTaxBeforeCess: tdsMetrics.taxBeforeCess,
    section87aRebate: tdsMetrics.rebate87a,
    healthEduCess: tdsMetrics.cess,
    annualTds: tdsMetrics.annualTds,
    monthlyTds,
    netTakeHome
  };
}

/**
 * Calculates 2026 New Tax Regime TDS (Sec 115BAC) for annual gross earnings.
 */
export function calculateTds2026(annualGross) {
  const gross = parseFloat(annualGross) || 0;
  const taxableIncome = Math.max(0, gross - STATUTORY_2026.STANDARD_DEDUCTION);

  // Section 87A rebate: zero tax if taxable income <= ₹7,00,000
  if (taxableIncome <= STATUTORY_2026.SEC_87A_CEILING) {
    return {
      taxableIncome,
      taxBeforeCess: 0,
      rebate87a: 0,
      cess: 0,
      annualTds: 0,
      monthlyTds: 0
    };
  }

  let tax = 0;
  let rem = taxableIncome;

  // 3L - 7L @ 5% (max 20,000)
  if (rem > 300000) {
    const slab = Math.min(rem, 700000) - 300000;
    tax += slab * 0.05;
  }
  // 7L - 10L @ 10% (max 30,000)
  if (rem > 700000) {
    const slab = Math.min(rem, 1000000) - 700000;
    tax += slab * 0.10;
  }
  // 10L - 12L @ 15% (max 30,000)
  if (rem > 1000000) {
    const slab = Math.min(rem, 1200000) - 1000000;
    tax += slab * 0.15;
  }
  // 12L - 15L @ 20% (max 60,000)
  if (rem > 1200000) {
    const slab = Math.min(rem, 1500000) - 1200000;
    tax += slab * 0.20;
  }
  // Above 15L @ 30%
  if (rem > 1500000) {
    const slab = rem - 1500000;
    tax += slab * 0.30;
  }

  const taxBeforeCess = Math.round(tax * 100) / 100;
  const cess = Math.round((taxBeforeCess * STATUTORY_2026.CESS_RATE) * 100) / 100;
  const annualTds = Math.round((taxBeforeCess + cess) * 100) / 100;
  const monthlyTds = Math.round((annualTds / 12) * 100) / 100;

  return {
    taxableIncome,
    taxBeforeCess,
    rebate87a: 0,
    cess,
    annualTds,
    monthlyTds
  };
}

package com.payrollpro.service;

import com.payrollpro.dto.StatutoryBreakdown2026;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * Standalone Statutory & EPFO 2026 Calculation Engine.
 * Encapsulates all statutory logic for Indian enterprise payroll (EPFO, ESIC, Professional Tax, and 2026 New Tax Regime TDS).
 * Designed as a pure, modular component with zero external side effects so it can be used, tested, or customized independently.
 * Strictly adheres to NO LOMBOK guidelines.
 */
@Component
public class StatutoryCalculator2026 {

    // Salary Ratio Constants
    public static final BigDecimal BASIC_PERCENT = new BigDecimal("0.50");
    public static final BigDecimal HRA_PERCENT = new BigDecimal("0.40");

    // EPFO 2026 Statutory Rates & Caps
    public static final BigDecimal EPF_WAGE_CEILING = new BigDecimal("15000.00");
    public static final BigDecimal EE_EPF_RATE = new BigDecimal("0.12");
    public static final BigDecimal MAX_EE_EPF_MONTHLY = new BigDecimal("1800.00");
    public static final BigDecimal ER_EPS_RATE = new BigDecimal("0.0833");
    public static final BigDecimal MAX_ER_EPS_MONTHLY = new BigDecimal("1250.00");
    public static final BigDecimal ER_EPF_RATE = new BigDecimal("0.0367");
    public static final BigDecimal MAX_ER_EPF_MONTHLY = new BigDecimal("550.00");
    public static final BigDecimal EDLI_RATE = new BigDecimal("0.0050");
    public static final BigDecimal MAX_EDLI_MONTHLY = new BigDecimal("75.00");
    public static final BigDecimal EPF_ADMIN_RATE = new BigDecimal("0.0050");
    public static final BigDecimal MAX_EPF_ADMIN_MONTHLY = new BigDecimal("75.00");

    // ESIC Statutory Thresholds
    public static final BigDecimal ESIC_WAGE_CEILING = new BigDecimal("21000.00");
    public static final BigDecimal EE_ESIC_RATE = new BigDecimal("0.0075");
    public static final BigDecimal ER_ESIC_RATE = new BigDecimal("0.0325");

    // Professional Tax & Income Tax 2026 (New Regime u/s 115BAC)
    public static final BigDecimal DEFAULT_PROFESSIONAL_TAX = new BigDecimal("200.00");
    public static final BigDecimal STANDARD_DEDUCTION_2026 = new BigDecimal("75000.00");
    public static final BigDecimal SEC_87A_REBATE_CEILING = new BigDecimal("700000.00");
    public static final BigDecimal HEALTH_EDU_CESS_RATE = new BigDecimal("0.04");

    /**
     * Computes the complete itemized 2026 statutory breakdown for a given annual CTC.
     *
     * @param annualCTC     Total annual Cost to Company (CTC)
     * @param customPT      Optional custom monthly Professional Tax (defaults to ₹200)
     * @param customTds     Optional custom monthly TDS (if null or zero, automatically computed using 2026 tax slabs)
     * @param effectiveFrom Effective date for the structure
     * @return Complete itemized StatutoryBreakdown2026 object
     */
    public StatutoryBreakdown2026 computeStatutoryBreakdown(BigDecimal annualCTC,
                                                            BigDecimal customPT,
                                                            BigDecimal customTds,
                                                            LocalDate effectiveFrom) {
        BigDecimal ctc = (annualCTC != null && annualCTC.compareTo(BigDecimal.ZERO) > 0)
                ? annualCTC.setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        // 1. Earnings Breakdown
        BigDecimal monthlyGross = ctc.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal basicSalary = monthlyGross.multiply(BASIC_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal hra = basicSalary.multiply(HRA_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal specialAllowance = monthlyGross.subtract(basicSalary).subtract(hra).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        // 2. EPFO Breakdown
        BigDecimal epfWage = basicSalary.min(EPF_WAGE_CEILING).setScale(2, RoundingMode.HALF_UP);
        BigDecimal eeEpf = epfWage.multiply(EE_EPF_RATE).setScale(2, RoundingMode.HALF_UP).min(MAX_EE_EPF_MONTHLY);
        // EPS is statutory 8 1/3% (1/12 of wage), capped at exact ₹1,250.00/month
        BigDecimal erEps = epfWage.multiply(BigDecimal.valueOf(25)).divide(BigDecimal.valueOf(300), 2, RoundingMode.HALF_UP).min(MAX_ER_EPS_MONTHLY);
        BigDecimal erEpf = eeEpf.subtract(erEps).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP).min(MAX_ER_EPF_MONTHLY);
        BigDecimal edli = epfWage.multiply(EDLI_RATE).setScale(2, RoundingMode.HALF_UP).min(MAX_EDLI_MONTHLY);
        BigDecimal epfAdmin = epfWage.multiply(EPF_ADMIN_RATE).setScale(2, RoundingMode.HALF_UP).min(MAX_EPF_ADMIN_MONTHLY);
        BigDecimal totalErCost = erEpf.add(erEps).add(edli).add(epfAdmin).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalEpfoRemittance = eeEpf.add(totalErCost).setScale(2, RoundingMode.HALF_UP);

        // 3. ESIC Breakdown
        boolean esicEligible = monthlyGross.compareTo(BigDecimal.ZERO) > 0 && monthlyGross.compareTo(ESIC_WAGE_CEILING) <= 0;
        BigDecimal eeEsic = esicEligible ? monthlyGross.multiply(EE_ESIC_RATE).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal erEsic = esicEligible ? monthlyGross.multiply(ER_ESIC_RATE).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        // 4. Professional Tax
        BigDecimal pt = customPT != null ? customPT.setScale(2, RoundingMode.HALF_UP) : DEFAULT_PROFESSIONAL_TAX;

        // 5. 2026 TDS (New Tax Regime - Sec 115BAC)
        BigDecimal annualGross = monthlyGross.multiply(BigDecimal.valueOf(12)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxableIncome = annualGross.subtract(STANDARD_DEDUCTION_2026).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        BigDecimal annualTaxBeforeCess = computeNewRegimeTaxBeforeCess(taxableIncome);
        BigDecimal cess = annualTaxBeforeCess.multiply(HEALTH_EDU_CESS_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal computedAnnualTds = annualTaxBeforeCess.add(cess).setScale(2, RoundingMode.HALF_UP);
        BigDecimal computedMonthlyTds = computedAnnualTds.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        BigDecimal finalMonthlyTds = (customTds != null && customTds.compareTo(BigDecimal.ZERO) > 0)
                ? customTds.setScale(2, RoundingMode.HALF_UP)
                : computedMonthlyTds;

        // 6. Net Take Home
        BigDecimal netTakeHome = monthlyGross
                .subtract(eeEpf)
                .subtract(pt)
                .subtract(finalMonthlyTds)
                .subtract(eeEsic)
                .setScale(2, RoundingMode.HALF_UP);

        // Populate DTO
        StatutoryBreakdown2026 result = new StatutoryBreakdown2026();
        result.setAnnualCTC(ctc);
        result.setMonthlyGross(monthlyGross);
        result.setBasicSalary(basicSalary);
        result.setHra(hra);
        result.setSpecialAllowance(specialAllowance);

        result.setEpfWage(epfWage);
        result.setEmployeeEpf(eeEpf);
        result.setEmployerEps(erEps);
        result.setEmployerEpf(erEpf);
        result.setEdliEmployer(edli);
        result.setEpfAdminEmployer(epfAdmin);
        result.setTotalEmployerCost(totalErCost);
        result.setTotalEpfoRemittance(totalEpfoRemittance);

        result.setEsicEligible(esicEligible);
        result.setEmployeeEsic(eeEsic);
        result.setEmployerEsic(erEsic);

        result.setProfessionalTax(pt);
        result.setStandardDeduction(STANDARD_DEDUCTION_2026);
        result.setTaxableIncome(taxableIncome);
        result.setAnnualTaxBeforeCess(annualTaxBeforeCess);
        result.setSection87aRebate(taxableIncome.compareTo(SEC_87A_REBATE_CEILING) <= 0 ? annualTaxBeforeCess : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        result.setHealthEduCess(cess);
        result.setAnnualTds(computedAnnualTds);
        result.setMonthlyTds(finalMonthlyTds);

        result.setNetTakeHome(netTakeHome);
        result.setEffectiveFrom(effectiveFrom != null ? effectiveFrom : LocalDate.now());

        return result;
    }

    /**
     * Pure function to calculate tax under the 2026 New Tax Regime slabs (Sec 115BAC).
     * Slabs:
     * - ₹0 to ₹3,00,000: NIL
     * - ₹3,00,001 to ₹7,00,000: 5% (max ₹20,000)
     * - ₹7,00,001 to ₹10,00,000: 10% (max ₹30,000)
     * - ₹10,00,001 to ₹12,00,000: 15% (max ₹30,000)
     * - ₹12,00,001 to ₹15,00,000: 20% (max ₹60,000)
     * - Above ₹15,00,000: 30%
     * Section 87A rebate applies if taxable income <= ₹7,00,000 (tax becomes ₹0).
     */
    public static BigDecimal computeNewRegimeTaxBeforeCess(BigDecimal taxable) {
        if (taxable == null || taxable.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        // Section 87A rebate: zero tax if taxable income <= ₹7,00,000
        if (taxable.compareTo(SEC_87A_REBATE_CEILING) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal rem = taxable;

        // Slab 1: 3L to 7L (5%)
        if (rem.compareTo(new BigDecimal("300000.00")) > 0) {
            BigDecimal taxableInSlab = rem.min(new BigDecimal("700000.00")).subtract(new BigDecimal("300000.00"));
            tax = tax.add(taxableInSlab.multiply(new BigDecimal("0.05")));
        }

        // Slab 2: 7L to 10L (10%)
        if (rem.compareTo(new BigDecimal("700000.00")) > 0) {
            BigDecimal taxableInSlab = rem.min(new BigDecimal("1000000.00")).subtract(new BigDecimal("700000.00"));
            tax = tax.add(taxableInSlab.multiply(new BigDecimal("0.10")));
        }

        // Slab 3: 10L to 12L (15%)
        if (rem.compareTo(new BigDecimal("1000000.00")) > 0) {
            BigDecimal taxableInSlab = rem.min(new BigDecimal("1200000.00")).subtract(new BigDecimal("1000000.00"));
            tax = tax.add(taxableInSlab.multiply(new BigDecimal("0.15")));
        }

        // Slab 4: 12L to 15L (20%)
        if (rem.compareTo(new BigDecimal("1200000.00")) > 0) {
            BigDecimal taxableInSlab = rem.min(new BigDecimal("1500000.00")).subtract(new BigDecimal("1200000.00"));
            tax = tax.add(taxableInSlab.multiply(new BigDecimal("0.20")));
        }

        // Slab 5: Above 15L (30%)
        if (rem.compareTo(new BigDecimal("1500000.00")) > 0) {
            BigDecimal taxableInSlab = rem.subtract(new BigDecimal("1500000.00"));
            tax = tax.add(taxableInSlab.multiply(new BigDecimal("0.30")));
        }

        return tax.setScale(2, RoundingMode.HALF_UP);
    }
}

package com.payrollpro.service;

import com.payrollpro.dto.StatutoryBreakdown2026;
import com.payrollpro.model.SalaryStructure;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class StatutoryRuleEngine {

    public static final BigDecimal BASIC_PERCENT = StatutoryCalculator2026.BASIC_PERCENT;
    public static final BigDecimal HRA_PERCENT = StatutoryCalculator2026.HRA_PERCENT;
    public static final BigDecimal EPF_RATE = StatutoryCalculator2026.EE_EPF_RATE;
    public static final BigDecimal EPF_WAGE_CEILING = StatutoryCalculator2026.EPF_WAGE_CEILING;
    public static final BigDecimal EPF_MONTHLY_CAP = StatutoryCalculator2026.MAX_EE_EPF_MONTHLY;
    public static final BigDecimal DEFAULT_PROFESSIONAL_TAX = StatutoryCalculator2026.DEFAULT_PROFESSIONAL_TAX;

    private final StatutoryCalculator2026 statutoryCalculator2026;

    public StatutoryRuleEngine() {
        this.statutoryCalculator2026 = new StatutoryCalculator2026();
    }

    public StatutoryRuleEngine(StatutoryCalculator2026 statutoryCalculator2026) {
        this.statutoryCalculator2026 = statutoryCalculator2026 != null ? statutoryCalculator2026 : new StatutoryCalculator2026();
    }

    public SalaryStructure computeSalaryStructure(BigDecimal annualCTC,
                                                  BigDecimal customPT,
                                                  BigDecimal customTds,
                                                  LocalDate effectiveFrom) {
        StatutoryBreakdown2026 breakdown = statutoryCalculator2026.computeStatutoryBreakdown(
                annualCTC, customPT, customTds, effectiveFrom);

        SalaryStructure structure = new SalaryStructure();
        structure.setAnnualCTC(breakdown.getAnnualCTC());
        structure.setMonthlyGross(breakdown.getMonthlyGross());
        structure.setBasicSalary(breakdown.getBasicSalary());
        structure.setHra(breakdown.getHra());
        structure.setSpecialAllowance(breakdown.getSpecialAllowance());
        structure.setEpfEmployee(breakdown.getEmployeeEpf());
        structure.setEpfEmployer(breakdown.getEmployerEpf());
        structure.setProfessionalTax(breakdown.getProfessionalTax());
        structure.setMonthlyTds(breakdown.getMonthlyTds());
        structure.setEffectiveFrom(breakdown.getEffectiveFrom());
        return structure;
    }

    public StatutoryBreakdown2026 computeFullBreakdown(BigDecimal annualCTC,
                                                       BigDecimal customPT,
                                                       BigDecimal customTds,
                                                       LocalDate effectiveFrom) {
        return statutoryCalculator2026.computeStatutoryBreakdown(annualCTC, customPT, customTds, effectiveFrom);
    }
}

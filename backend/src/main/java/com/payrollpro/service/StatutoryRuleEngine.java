package com.payrollpro.service;

import com.payrollpro.model.SalaryStructure;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Component
public class StatutoryRuleEngine {

    public static final BigDecimal BASIC_PERCENT = new BigDecimal("0.50");
    public static final BigDecimal HRA_PERCENT = new BigDecimal("0.40");
    public static final BigDecimal EPF_RATE = new BigDecimal("0.12");
    public static final BigDecimal EPF_WAGE_CEILING = new BigDecimal("15000.00");
    public static final BigDecimal EPF_MONTHLY_CAP = new BigDecimal("1800.00");
    public static final BigDecimal DEFAULT_PROFESSIONAL_TAX = new BigDecimal("200.00");

    public SalaryStructure computeSalaryStructure(BigDecimal annualCTC,
                                                  BigDecimal customPT,
                                                  BigDecimal customTds,
                                                  LocalDate effectiveFrom) {
        BigDecimal ctc = annualCTC != null ? annualCTC.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal monthlyGross = ctc.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal basicSalary = monthlyGross.multiply(BASIC_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal hra = basicSalary.multiply(HRA_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal specialAllowance = monthlyGross.subtract(basicSalary).subtract(hra).setScale(2, RoundingMode.HALF_UP);

        // EPF capped at ₹1,800/month (12% of basic, wage ceiling ₹15,000)
        BigDecimal uncappedEpf = basicSalary.multiply(EPF_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal epf = uncappedEpf.min(EPF_MONTHLY_CAP);

        BigDecimal pt = customPT != null ? customPT.setScale(2, RoundingMode.HALF_UP) : DEFAULT_PROFESSIONAL_TAX;
        BigDecimal tds = customTds != null ? customTds.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        SalaryStructure structure = new SalaryStructure();
        structure.setAnnualCTC(ctc);
        structure.setMonthlyGross(monthlyGross);
        structure.setBasicSalary(basicSalary);
        structure.setHra(hra);
        structure.setSpecialAllowance(specialAllowance);
        structure.setEpfEmployee(epf);
        structure.setEpfEmployer(epf);
        structure.setProfessionalTax(pt);
        structure.setMonthlyTds(tds);
        structure.setEffectiveFrom(effectiveFrom != null ? effectiveFrom : LocalDate.now());
        return structure;
    }
}

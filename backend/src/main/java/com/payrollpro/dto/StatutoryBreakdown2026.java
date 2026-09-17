package com.payrollpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Detailed 2026 Statutory & EPFO Component Breakdown DTO.
 * Encapsulates all statutory deductions, employer EPFO accounts, and New Tax Regime TDS metrics.
 * Follows strict NO LOMBOK rule with explicit constructors, getters, and setters.
 */
public class StatutoryBreakdown2026 {

    // Salary Earnings Structure
    private BigDecimal annualCTC;
    private BigDecimal monthlyGross;
    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal specialAllowance;

    // EPFO Breakdown (Statutory ₹15,000 wage ceiling)
    private BigDecimal epfWage;
    private BigDecimal employeeEpf;          // Account 1: 12% (Max ₹1,800/mo)
    private BigDecimal employerEps;          // Account 10: 8.33% (Max ₹1,250/mo)
    private BigDecimal employerEpf;          // Account 1: 3.67% (Max ₹550/mo)
    private BigDecimal edliEmployer;         // Account 21: 0.50% (Max ₹75/mo)
    private BigDecimal epfAdminEmployer;     // Account 2: 0.50% (Max ₹75/mo)
    private BigDecimal totalEmployerCost;    // Total Employer Remittance (Max ₹1,950/mo)
    private BigDecimal totalEpfoRemittance;  // Employee + Employer Total (Max ₹3,750/mo)

    // ESIC Breakdown (Applicable when gross <= ₹21,000)
    private boolean esicEligible;
    private BigDecimal employeeEsic;         // 0.75%
    private BigDecimal employerEsic;         // 3.25%

    // Other Deductions & Taxes
    private BigDecimal professionalTax;      // Standard ₹200/mo
    private BigDecimal standardDeduction;    // ₹75,000 (Budget 2024 / 2026 New Tax Regime)
    private BigDecimal taxableIncome;        // max(0, annualGross - 75000)
    private BigDecimal annualTaxBeforeCess;
    private BigDecimal section87aRebate;     // Rebate up to ₹25,000 if taxable <= ₹7,00,000
    private BigDecimal healthEduCess;        // 4% of net tax
    private BigDecimal annualTds;            // Annual tax with cess
    private BigDecimal monthlyTds;           // annualTds / 12

    // Estimated Net Take-Home
    private BigDecimal netTakeHome;          // monthlyGross - (employeeEpf + professionalTax + monthlyTds + employeeEsic)
    private LocalDate effectiveFrom;

    public StatutoryBreakdown2026() {
    }

    // ---- Getters and Setters ----

    public BigDecimal getAnnualCTC() {
        return annualCTC;
    }

    public void setAnnualCTC(BigDecimal annualCTC) {
        this.annualCTC = annualCTC;
    }

    public BigDecimal getMonthlyGross() {
        return monthlyGross;
    }

    public void setMonthlyGross(BigDecimal monthlyGross) {
        this.monthlyGross = monthlyGross;
    }

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getHra() {
        return hra;
    }

    public void setHra(BigDecimal hra) {
        this.hra = hra;
    }

    public BigDecimal getSpecialAllowance() {
        return specialAllowance;
    }

    public void setSpecialAllowance(BigDecimal specialAllowance) {
        this.specialAllowance = specialAllowance;
    }

    public BigDecimal getEpfWage() {
        return epfWage;
    }

    public void setEpfWage(BigDecimal epfWage) {
        this.epfWage = epfWage;
    }

    public BigDecimal getEmployeeEpf() {
        return employeeEpf;
    }

    public void setEmployeeEpf(BigDecimal employeeEpf) {
        this.employeeEpf = employeeEpf;
    }

    public BigDecimal getEmployerEps() {
        return employerEps;
    }

    public void setEmployerEps(BigDecimal employerEps) {
        this.employerEps = employerEps;
    }

    public BigDecimal getEmployerEpf() {
        return employerEpf;
    }

    public void setEmployerEpf(BigDecimal employerEpf) {
        this.employerEpf = employerEpf;
    }

    public BigDecimal getEdliEmployer() {
        return edliEmployer;
    }

    public void setEdliEmployer(BigDecimal edliEmployer) {
        this.edliEmployer = edliEmployer;
    }

    public BigDecimal getEpfAdminEmployer() {
        return epfAdminEmployer;
    }

    public void setEpfAdminEmployer(BigDecimal epfAdminEmployer) {
        this.epfAdminEmployer = epfAdminEmployer;
    }

    public BigDecimal getTotalEmployerCost() {
        return totalEmployerCost;
    }

    public void setTotalEmployerCost(BigDecimal totalEmployerCost) {
        this.totalEmployerCost = totalEmployerCost;
    }

    public BigDecimal getTotalEpfoRemittance() {
        return totalEpfoRemittance;
    }

    public void setTotalEpfoRemittance(BigDecimal totalEpfoRemittance) {
        this.totalEpfoRemittance = totalEpfoRemittance;
    }

    public boolean isEsicEligible() {
        return esicEligible;
    }

    public void setEsicEligible(boolean esicEligible) {
        this.esicEligible = esicEligible;
    }

    public BigDecimal getEmployeeEsic() {
        return employeeEsic;
    }

    public void setEmployeeEsic(BigDecimal employeeEsic) {
        this.employeeEsic = employeeEsic;
    }

    public BigDecimal getEmployerEsic() {
        return employerEsic;
    }

    public void setEmployerEsic(BigDecimal employerEsic) {
        this.employerEsic = employerEsic;
    }

    public BigDecimal getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(BigDecimal professionalTax) {
        this.professionalTax = professionalTax;
    }

    public BigDecimal getStandardDeduction() {
        return standardDeduction;
    }

    public void setStandardDeduction(BigDecimal standardDeduction) {
        this.standardDeduction = standardDeduction;
    }

    public BigDecimal getTaxableIncome() {
        return taxableIncome;
    }

    public void setTaxableIncome(BigDecimal taxableIncome) {
        this.taxableIncome = taxableIncome;
    }

    public BigDecimal getAnnualTaxBeforeCess() {
        return annualTaxBeforeCess;
    }

    public void setAnnualTaxBeforeCess(BigDecimal annualTaxBeforeCess) {
        this.annualTaxBeforeCess = annualTaxBeforeCess;
    }

    public BigDecimal getSection87aRebate() {
        return section87aRebate;
    }

    public void setSection87aRebate(BigDecimal section87aRebate) {
        this.section87aRebate = section87aRebate;
    }

    public BigDecimal getHealthEduCess() {
        return healthEduCess;
    }

    public void setHealthEduCess(BigDecimal healthEduCess) {
        this.healthEduCess = healthEduCess;
    }

    public BigDecimal getAnnualTds() {
        return annualTds;
    }

    public void setAnnualTds(BigDecimal annualTds) {
        this.annualTds = annualTds;
    }

    public BigDecimal getMonthlyTds() {
        return monthlyTds;
    }

    public void setMonthlyTds(BigDecimal monthlyTds) {
        this.monthlyTds = monthlyTds;
    }

    public BigDecimal getNetTakeHome() {
        return netTakeHome;
    }

    public void setNetTakeHome(BigDecimal netTakeHome) {
        this.netTakeHome = netTakeHome;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }
}

package com.payrollpro.dto;

import com.payrollpro.model.SalaryStructure;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public class SalaryStructureResponse {

    private Long id;
    private Long companyId;
    private Long employeeId;
    private BigDecimal annualCTC;
    private BigDecimal monthlyGross;
    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal specialAllowance;
    private BigDecimal epfEmployee;
    private BigDecimal epfEmployer;
    private BigDecimal professionalTax;
    private BigDecimal monthlyTds;
    private LocalDate effectiveFrom;

    // Detailed 2026 EPFO & Net Pay Fields
    private BigDecimal epfWage;
    private BigDecimal employerEps;
    private BigDecimal employerEpfShare;
    private BigDecimal edliEmployer;
    private BigDecimal epfAdminEmployer;
    private BigDecimal totalEmployerCost;
    private BigDecimal netTakeHome;

    // ---- Constructors ----

    public SalaryStructureResponse() {
    }

    public SalaryStructureResponse(SalaryStructure s) {
        this.id = s.getId();
        this.companyId = s.getCompanyId();
        this.employeeId = s.getEmployeeId();
        this.annualCTC = s.getAnnualCTC();
        this.monthlyGross = s.getMonthlyGross();
        this.basicSalary = s.getBasicSalary();
        this.hra = s.getHra();
        this.specialAllowance = s.getSpecialAllowance();
        this.epfEmployee = s.getEpfEmployee();
        this.epfEmployer = s.getEpfEmployer();
        this.professionalTax = s.getProfessionalTax();
        this.monthlyTds = s.getMonthlyTds() != null ? s.getMonthlyTds() : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        this.effectiveFrom = s.getEffectiveFrom();

        // Populate 2026 detailed EPFO metrics
        BigDecimal basic = s.getBasicSalary() != null ? s.getBasicSalary() : BigDecimal.ZERO;
        this.epfWage = basic.min(new BigDecimal("15000.00")).setScale(2, RoundingMode.HALF_UP);
        this.employerEps = epfWage.multiply(BigDecimal.valueOf(25)).divide(BigDecimal.valueOf(300), 2, RoundingMode.HALF_UP).min(new BigDecimal("1250.00"));
        BigDecimal eeEpf = s.getEpfEmployee() != null ? s.getEpfEmployee() : BigDecimal.ZERO;
        this.employerEpfShare = eeEpf.subtract(this.employerEps).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP).min(new BigDecimal("550.00"));
        this.edliEmployer = epfWage.multiply(new BigDecimal("0.0050")).setScale(2, RoundingMode.HALF_UP).min(new BigDecimal("75.00"));
        this.epfAdminEmployer = epfWage.multiply(new BigDecimal("0.0050")).setScale(2, RoundingMode.HALF_UP).min(new BigDecimal("75.00"));
        this.totalEmployerCost = this.employerEpfShare.add(this.employerEps).add(this.edliEmployer).add(this.epfAdminEmployer).setScale(2, RoundingMode.HALF_UP);

        BigDecimal gross = s.getMonthlyGross() != null ? s.getMonthlyGross() : BigDecimal.ZERO;
        BigDecimal pt = s.getProfessionalTax() != null ? s.getProfessionalTax() : BigDecimal.ZERO;
        this.netTakeHome = gross.subtract(eeEpf).subtract(pt).subtract(this.monthlyTds).setScale(2, RoundingMode.HALF_UP);
    }

    public SalaryStructureResponse(StatutoryBreakdown2026 b) {
        this.annualCTC = b.getAnnualCTC();
        this.monthlyGross = b.getMonthlyGross();
        this.basicSalary = b.getBasicSalary();
        this.hra = b.getHra();
        this.specialAllowance = b.getSpecialAllowance();
        this.epfEmployee = b.getEmployeeEpf();
        this.epfEmployer = b.getEmployerEpf();
        this.professionalTax = b.getProfessionalTax();
        this.monthlyTds = b.getMonthlyTds();
        this.effectiveFrom = b.getEffectiveFrom();

        this.epfWage = b.getEpfWage();
        this.employerEps = b.getEmployerEps();
        this.employerEpfShare = b.getEmployerEpf();
        this.edliEmployer = b.getEdliEmployer();
        this.epfAdminEmployer = b.getEpfAdminEmployer();
        this.totalEmployerCost = b.getTotalEmployerCost();
        this.netTakeHome = b.getNetTakeHome();
    }

    // ---- Getters and Setters ----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

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

    public BigDecimal getEpfEmployee() {
        return epfEmployee;
    }

    public void setEpfEmployee(BigDecimal epfEmployee) {
        this.epfEmployee = epfEmployee;
    }

    public BigDecimal getEpfEmployer() {
        return epfEmployer;
    }

    public void setEpfEmployer(BigDecimal epfEmployer) {
        this.epfEmployer = epfEmployer;
    }

    public BigDecimal getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(BigDecimal professionalTax) {
        this.professionalTax = professionalTax;
    }

    public BigDecimal getMonthlyTds() {
        return monthlyTds;
    }

    public void setMonthlyTds(BigDecimal monthlyTds) {
        this.monthlyTds = monthlyTds;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public BigDecimal getEpfWage() {
        return epfWage;
    }

    public void setEpfWage(BigDecimal epfWage) {
        this.epfWage = epfWage;
    }

    public BigDecimal getEmployerEps() {
        return employerEps;
    }

    public void setEmployerEps(BigDecimal employerEps) {
        this.employerEps = employerEps;
    }

    public BigDecimal getEmployerEpfShare() {
        return employerEpfShare;
    }

    public void setEmployerEpfShare(BigDecimal employerEpfShare) {
        this.employerEpfShare = employerEpfShare;
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

    public BigDecimal getNetTakeHome() {
        return netTakeHome;
    }

    public void setNetTakeHome(BigDecimal netTakeHome) {
        this.netTakeHome = netTakeHome;
    }
}

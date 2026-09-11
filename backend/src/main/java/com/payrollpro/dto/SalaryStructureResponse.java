package com.payrollpro.dto;

import com.payrollpro.model.SalaryStructure;
import java.math.BigDecimal;
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
        this.monthlyTds = s.getMonthlyTds();
        this.effectiveFrom = s.getEffectiveFrom();
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
}

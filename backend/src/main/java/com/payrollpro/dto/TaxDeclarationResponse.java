package com.payrollpro.dto;

import com.payrollpro.model.TaxDeclarationStatus;
import com.payrollpro.model.TaxRegime;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TaxDeclarationResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String empCode;
    private String financialYear;
    private TaxRegime regime;
    private BigDecimal section80C;
    private BigDecimal section80D;
    private BigDecimal section24HomeLoan;
    private BigDecimal annualRentPaid;
    private Boolean isMetro;
    private BigDecimal otherExemptions;
    private TaxDeclarationStatus status;
    private String adminRemarks;
    private BigDecimal projectedAnnualTax;
    private BigDecimal monthlyTds;
    private LocalDateTime updatedAt;

    public TaxDeclarationResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public String getFinancialYear() {
        return financialYear;
    }

    public void setFinancialYear(String financialYear) {
        this.financialYear = financialYear;
    }

    public TaxRegime getRegime() {
        return regime;
    }

    public void setRegime(TaxRegime regime) {
        this.regime = regime;
    }

    public BigDecimal getSection80C() {
        return section80C;
    }

    public void setSection80C(BigDecimal section80C) {
        this.section80C = section80C;
    }

    public BigDecimal getSection80D() {
        return section80D;
    }

    public void setSection80D(BigDecimal section80D) {
        this.section80D = section80D;
    }

    public BigDecimal getSection24HomeLoan() {
        return section24HomeLoan;
    }

    public void setSection24HomeLoan(BigDecimal section24HomeLoan) {
        this.section24HomeLoan = section24HomeLoan;
    }

    public BigDecimal getAnnualRentPaid() {
        return annualRentPaid;
    }

    public void setAnnualRentPaid(BigDecimal annualRentPaid) {
        this.annualRentPaid = annualRentPaid;
    }

    public Boolean getIsMetro() {
        return isMetro;
    }

    public void setIsMetro(Boolean isMetro) {
        this.isMetro = isMetro;
    }

    public BigDecimal getOtherExemptions() {
        return otherExemptions;
    }

    public void setOtherExemptions(BigDecimal otherExemptions) {
        this.otherExemptions = otherExemptions;
    }

    public TaxDeclarationStatus getStatus() {
        return status;
    }

    public void setStatus(TaxDeclarationStatus status) {
        this.status = status;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public BigDecimal getProjectedAnnualTax() {
        return projectedAnnualTax;
    }

    public void setProjectedAnnualTax(BigDecimal projectedAnnualTax) {
        this.projectedAnnualTax = projectedAnnualTax;
    }

    public BigDecimal getMonthlyTds() {
        return monthlyTds;
    }

    public void setMonthlyTds(BigDecimal monthlyTds) {
        this.monthlyTds = monthlyTds;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

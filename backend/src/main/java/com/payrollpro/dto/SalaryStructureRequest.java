package com.payrollpro.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class SalaryStructureRequest {

    @NotNull(message = "Annual CTC is required")
    @DecimalMin(value = "0.01", message = "Annual CTC must be greater than zero")
    private BigDecimal annualCTC;

    private BigDecimal monthlyTds;

    private BigDecimal professionalTax;

    private LocalDate effectiveFrom;

    // ---- Constructors ----

    public SalaryStructureRequest() {
    }

    public SalaryStructureRequest(BigDecimal annualCTC) {
        this.annualCTC = annualCTC;
    }

    public SalaryStructureRequest(BigDecimal annualCTC, BigDecimal monthlyTds, BigDecimal professionalTax, LocalDate effectiveFrom) {
        this.annualCTC = annualCTC;
        this.monthlyTds = monthlyTds;
        this.professionalTax = professionalTax;
        this.effectiveFrom = effectiveFrom;
    }

    // ---- Getters and Setters ----

    public BigDecimal getAnnualCTC() {
        return annualCTC;
    }

    public void setAnnualCTC(BigDecimal annualCTC) {
        this.annualCTC = annualCTC;
    }

    public BigDecimal getMonthlyTds() {
        return monthlyTds;
    }

    public void setMonthlyTds(BigDecimal monthlyTds) {
        this.monthlyTds = monthlyTds;
    }

    public BigDecimal getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(BigDecimal professionalTax) {
        this.professionalTax = professionalTax;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }
}

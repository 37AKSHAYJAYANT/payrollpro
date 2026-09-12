package com.payrollpro.dto;

import com.payrollpro.model.TaxRegime;
import java.math.BigDecimal;

public class TaxDeclarationRequest {

    private String financialYear; // e.g. "2026-2027"
    private TaxRegime regime;
    private BigDecimal section80C;
    private BigDecimal section80D;
    private BigDecimal section24HomeLoan;
    private BigDecimal annualRentPaid;
    private Boolean isMetro;
    private BigDecimal otherExemptions;

    public TaxDeclarationRequest() {
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
}

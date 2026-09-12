package com.payrollpro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_declarations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "employeeId", "financialYear"})
})
public class TaxDeclaration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false, length = 10)
    private String financialYear; // e.g. "2026-2027"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaxRegime regime = TaxRegime.NEW_REGIME;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal section80C = BigDecimal.ZERO; // Max 1,50,000 (PPF, ELSS, Life Insurance, EPF)

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal section80D = BigDecimal.ZERO; // Max 25,000 / 75,000 (Mediclaim)

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal section24HomeLoan = BigDecimal.ZERO; // Max 2,00,000 (Home Loan Interest)

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal annualRentPaid = BigDecimal.ZERO; // For Section 10(13A) HRA exemption

    @Column(nullable = false)
    private Boolean isMetro = true; // Metro 50% vs Non-Metro 40% HRA rule

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal otherExemptions = BigDecimal.ZERO; // Other Chapter VI-A deductions

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaxDeclarationStatus status = TaxDeclarationStatus.SUBMITTED;

    @Column(length = 255)
    private String adminRemarks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    public TaxDeclaration() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.regime == null) this.regime = TaxRegime.NEW_REGIME;
        if (this.status == null) this.status = TaxDeclarationStatus.SUBMITTED;
        if (this.section80C == null) this.section80C = BigDecimal.ZERO;
        if (this.section80D == null) this.section80D = BigDecimal.ZERO;
        if (this.section24HomeLoan == null) this.section24HomeLoan = BigDecimal.ZERO;
        if (this.annualRentPaid == null) this.annualRentPaid = BigDecimal.ZERO;
        if (this.otherExemptions == null) this.otherExemptions = BigDecimal.ZERO;
        if (this.isMetro == null) this.isMetro = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

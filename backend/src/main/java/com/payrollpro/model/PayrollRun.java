package com.payrollpro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_runs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "run_year", "run_month"})
})
public class PayrollRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(name = "run_month", nullable = false)
    private Integer month;

    @Column(name = "run_year", nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PayrollRunStatus status = PayrollRunStatus.DRAFT;

    @Column(nullable = false)
    private Integer employeeCount = 0;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalGrossPay = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalNetPay = BigDecimal.ZERO;

    @Column
    private Long preparedBy;

    @Column
    private Long reviewedBy;

    @Column
    private Long approvedBy;

    @Column
    private LocalDateTime preparedAt;

    @Column
    private LocalDateTime reviewedAt;

    @Column
    private LocalDateTime approvedAt;

    // ---- Constructors ----

    public PayrollRun() {
    }

    public PayrollRun(Long companyId, Integer month, Integer year, Integer employeeCount,
                      BigDecimal totalGrossPay, BigDecimal totalDeductions, BigDecimal totalNetPay,
                      Long preparedBy) {
        this.companyId = companyId;
        this.month = month;
        this.year = year;
        this.status = PayrollRunStatus.DRAFT;
        this.employeeCount = employeeCount;
        this.totalGrossPay = totalGrossPay;
        this.totalDeductions = totalDeductions;
        this.totalNetPay = totalNetPay;
        this.preparedBy = preparedBy;
        this.preparedAt = LocalDateTime.now();
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

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public PayrollRunStatus getStatus() {
        return status;
    }

    public void setStatus(PayrollRunStatus status) {
        this.status = status;
    }

    public Integer getEmployeeCount() {
        return employeeCount;
    }

    public void setEmployeeCount(Integer employeeCount) {
        this.employeeCount = employeeCount;
    }

    public BigDecimal getTotalGrossPay() {
        return totalGrossPay;
    }

    public void setTotalGrossPay(BigDecimal totalGrossPay) {
        this.totalGrossPay = totalGrossPay;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public BigDecimal getTotalNetPay() {
        return totalNetPay;
    }

    public void setTotalNetPay(BigDecimal totalNetPay) {
        this.totalNetPay = totalNetPay;
    }

    public Long getPreparedBy() {
        return preparedBy;
    }

    public void setPreparedBy(Long preparedBy) {
        this.preparedBy = preparedBy;
    }

    public Long getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(Long reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getPreparedAt() {
        return preparedAt;
    }

    public void setPreparedAt(LocalDateTime preparedAt) {
        this.preparedAt = preparedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
}

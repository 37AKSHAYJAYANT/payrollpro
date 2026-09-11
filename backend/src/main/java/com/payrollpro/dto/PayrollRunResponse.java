package com.payrollpro.dto;

import com.payrollpro.model.PayrollRun;
import com.payrollpro.model.PayrollRunStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PayrollRunResponse {

    private Long id;
    private Long companyId;
    private Integer month;
    private Integer year;
    private PayrollRunStatus status;
    private Integer employeeCount;
    private BigDecimal totalGrossPay;
    private BigDecimal totalDeductions;
    private BigDecimal totalNetPay;
    private Long preparedBy;
    private Long reviewedBy;
    private Long approvedBy;
    private LocalDateTime preparedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime approvedAt;

    // ---- Constructors ----

    public PayrollRunResponse() {
    }

    public PayrollRunResponse(PayrollRun run) {
        this.id = run.getId();
        this.companyId = run.getCompanyId();
        this.month = run.getMonth();
        this.year = run.getYear();
        this.status = run.getStatus();
        this.employeeCount = run.getEmployeeCount();
        this.totalGrossPay = run.getTotalGrossPay();
        this.totalDeductions = run.getTotalDeductions();
        this.totalNetPay = run.getTotalNetPay();
        this.preparedBy = run.getPreparedBy();
        this.reviewedBy = run.getReviewedBy();
        this.approvedBy = run.getApprovedBy();
        this.preparedAt = run.getPreparedAt();
        this.reviewedAt = run.getReviewedAt();
        this.approvedAt = run.getApprovedAt();
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

package com.payrollpro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fnf_settlements", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "employeeId"})
})
public class FnFSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private LocalDate resignationDate;

    @Column(nullable = false)
    private LocalDate lastWorkingDate;

    @Column(nullable = false)
    private Integer noticePeriodDays = 30;

    @Column(nullable = false)
    private Integer servedDays = 30;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal leaveEncashmentDays = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal leaveEncashmentAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal gratuityAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal noticeRecoveryAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal otherAdditions = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netSettlementAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FnFSettlementStatus status = FnFSettlementStatus.DRAFT;

    @Column(length = 500)
    private String remarks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = FnFSettlementStatus.DRAFT;
        }
    }

    public FnFSettlement() {
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

    public LocalDate getResignationDate() {
        return resignationDate;
    }

    public void setResignationDate(LocalDate resignationDate) {
        this.resignationDate = resignationDate;
    }

    public LocalDate getLastWorkingDate() {
        return lastWorkingDate;
    }

    public void setLastWorkingDate(LocalDate lastWorkingDate) {
        this.lastWorkingDate = lastWorkingDate;
    }

    public Integer getNoticePeriodDays() {
        return noticePeriodDays;
    }

    public void setNoticePeriodDays(Integer noticePeriodDays) {
        this.noticePeriodDays = noticePeriodDays;
    }

    public Integer getServedDays() {
        return servedDays;
    }

    public void setServedDays(Integer servedDays) {
        this.servedDays = servedDays;
    }

    public BigDecimal getLeaveEncashmentDays() {
        return leaveEncashmentDays;
    }

    public void setLeaveEncashmentDays(BigDecimal leaveEncashmentDays) {
        this.leaveEncashmentDays = leaveEncashmentDays;
    }

    public BigDecimal getLeaveEncashmentAmount() {
        return leaveEncashmentAmount;
    }

    public void setLeaveEncashmentAmount(BigDecimal leaveEncashmentAmount) {
        this.leaveEncashmentAmount = leaveEncashmentAmount;
    }

    public BigDecimal getGratuityAmount() {
        return gratuityAmount;
    }

    public void setGratuityAmount(BigDecimal gratuityAmount) {
        this.gratuityAmount = gratuityAmount;
    }

    public BigDecimal getNoticeRecoveryAmount() {
        return noticeRecoveryAmount;
    }

    public void setNoticeRecoveryAmount(BigDecimal noticeRecoveryAmount) {
        this.noticeRecoveryAmount = noticeRecoveryAmount;
    }

    public BigDecimal getOtherAdditions() {
        return otherAdditions;
    }

    public void setOtherAdditions(BigDecimal otherAdditions) {
        this.otherAdditions = otherAdditions;
    }

    public BigDecimal getOtherDeductions() {
        return otherDeductions;
    }

    public void setOtherDeductions(BigDecimal otherDeductions) {
        this.otherDeductions = otherDeductions;
    }

    public BigDecimal getNetSettlementAmount() {
        return netSettlementAmount;
    }

    public void setNetSettlementAmount(BigDecimal netSettlementAmount) {
        this.netSettlementAmount = netSettlementAmount;
    }

    public FnFSettlementStatus getStatus() {
        return status;
    }

    public void setStatus(FnFSettlementStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

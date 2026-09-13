package com.payrollpro.dto;

import java.math.BigDecimal;

public class LeaveBalanceResponse {

    private Long id;
    private Long leaveTypeId;
    private String leaveTypeCode;
    private String leaveTypeName;
    private Integer year;
    private BigDecimal totalBalance;
    private BigDecimal used;
    private BigDecimal remaining;
    private BigDecimal remainingDays;
    private BigDecimal pendingDays;

    // ---- Constructors ----

    public LeaveBalanceResponse() {
    }

    public LeaveBalanceResponse(Long id, Long leaveTypeId, String leaveTypeCode, String leaveTypeName,
                                Integer year, BigDecimal totalBalance, BigDecimal used, BigDecimal remaining) {
        this.id = id;
        this.leaveTypeId = leaveTypeId;
        this.leaveTypeCode = leaveTypeCode;
        this.leaveTypeName = leaveTypeName;
        this.year = year;
        this.totalBalance = totalBalance;
        this.used = used;
        this.remaining = remaining;
        this.remainingDays = remaining;
        this.pendingDays = BigDecimal.ZERO;
    }

    public LeaveBalanceResponse(Long id, Long leaveTypeId, String leaveTypeCode, String leaveTypeName,
                                Integer year, BigDecimal totalBalance, BigDecimal used, BigDecimal remaining,
                                BigDecimal pendingDays) {
        this.id = id;
        this.leaveTypeId = leaveTypeId;
        this.leaveTypeCode = leaveTypeCode;
        this.leaveTypeName = leaveTypeName;
        this.year = year;
        this.totalBalance = totalBalance;
        this.used = used;
        this.remaining = remaining;
        this.remainingDays = remaining;
        this.pendingDays = pendingDays != null ? pendingDays : BigDecimal.ZERO;
    }

    // ---- Getters and Setters ----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(Long leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public String getLeaveTypeCode() {
        return leaveTypeCode;
    }

    public void setLeaveTypeCode(String leaveTypeCode) {
        this.leaveTypeCode = leaveTypeCode;
    }

    public String getLeaveTypeName() {
        return leaveTypeName;
    }

    public void setLeaveTypeName(String leaveTypeName) {
        this.leaveTypeName = leaveTypeName;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getTotalBalance() {
        return totalBalance;
    }

    public void setTotalBalance(BigDecimal totalBalance) {
        this.totalBalance = totalBalance;
    }

    public BigDecimal getUsed() {
        return used;
    }

    public void setUsed(BigDecimal used) {
        this.used = used;
    }

    public BigDecimal getRemaining() {
        return remaining;
    }

    public void setRemaining(BigDecimal remaining) {
        this.remaining = remaining;
        if (this.remainingDays == null) {
            this.remainingDays = remaining;
        }
    }

    public BigDecimal getRemainingDays() {
        return remainingDays != null ? remainingDays : remaining;
    }

    public void setRemainingDays(BigDecimal remainingDays) {
        this.remainingDays = remainingDays;
    }

    public BigDecimal getPendingDays() {
        return pendingDays != null ? pendingDays : BigDecimal.ZERO;
    }

    public void setPendingDays(BigDecimal pendingDays) {
        this.pendingDays = pendingDays;
    }
}

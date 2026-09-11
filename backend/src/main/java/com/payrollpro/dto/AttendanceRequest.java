package com.payrollpro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class AttendanceRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "Year is required")
    @Min(value = 2020, message = "Year must be valid")
    private Integer year;

    @NotNull(message = "Total working days is required")
    @Min(value = 1, message = "Total working days must be at least 1")
    private Integer totalWorkingDays;

    @NotNull(message = "Present days is required")
    private BigDecimal presentDays;

    private BigDecimal paidLeaveDays = BigDecimal.ZERO;

    private BigDecimal unpaidLeaveDays = BigDecimal.ZERO;

    // ---- Constructors ----

    public AttendanceRequest() {
    }

    public AttendanceRequest(Long employeeId, Integer month, Integer year, Integer totalWorkingDays,
                             BigDecimal presentDays, BigDecimal paidLeaveDays, BigDecimal unpaidLeaveDays) {
        this.employeeId = employeeId;
        this.month = month;
        this.year = year;
        this.totalWorkingDays = totalWorkingDays;
        this.presentDays = presentDays;
        this.paidLeaveDays = paidLeaveDays != null ? paidLeaveDays : BigDecimal.ZERO;
        this.unpaidLeaveDays = unpaidLeaveDays != null ? unpaidLeaveDays : BigDecimal.ZERO;
    }

    // ---- Getters and Setters ----

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
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

    public Integer getTotalWorkingDays() {
        return totalWorkingDays;
    }

    public void setTotalWorkingDays(Integer totalWorkingDays) {
        this.totalWorkingDays = totalWorkingDays;
    }

    public BigDecimal getPresentDays() {
        return presentDays;
    }

    public void setPresentDays(BigDecimal presentDays) {
        this.presentDays = presentDays;
    }

    public BigDecimal getPaidLeaveDays() {
        return paidLeaveDays;
    }

    public void setPaidLeaveDays(BigDecimal paidLeaveDays) {
        this.paidLeaveDays = paidLeaveDays;
    }

    public BigDecimal getUnpaidLeaveDays() {
        return unpaidLeaveDays;
    }

    public void setUnpaidLeaveDays(BigDecimal unpaidLeaveDays) {
        this.unpaidLeaveDays = unpaidLeaveDays;
    }
}

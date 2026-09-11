package com.payrollpro.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class LeaveSubmissionRequest {

    @NotNull(message = "Leave type is required")
    private Long leaveTypeId;

    @NotNull(message = "From date is required")
    private LocalDate fromDate;

    @NotNull(message = "To date is required")
    private LocalDate toDate;

    private Boolean isHalfDay = false;

    private String reason;

    // ---- Constructors ----

    public LeaveSubmissionRequest() {
    }

    public LeaveSubmissionRequest(Long leaveTypeId, LocalDate fromDate, LocalDate toDate, Boolean isHalfDay, String reason) {
        this.leaveTypeId = leaveTypeId;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.isHalfDay = isHalfDay != null ? isHalfDay : false;
        this.reason = reason;
    }

    // ---- Getters and Setters ----

    public Long getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(Long leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public Boolean getIsHalfDay() {
        return isHalfDay;
    }

    public void setIsHalfDay(Boolean isHalfDay) {
        this.isHalfDay = isHalfDay;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

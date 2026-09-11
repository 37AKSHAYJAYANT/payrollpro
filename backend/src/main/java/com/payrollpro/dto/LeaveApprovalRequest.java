package com.payrollpro.dto;

public class LeaveApprovalRequest {

    private String remarks;

    // ---- Constructors ----

    public LeaveApprovalRequest() {
    }

    public LeaveApprovalRequest(String remarks) {
        this.remarks = remarks;
    }

    // ---- Getters and Setters ----

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}

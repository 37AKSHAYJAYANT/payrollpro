package com.payrollpro.dto;

public class EmailDispatchResult {

    private Long recordId;
    private String employeeCode;
    private String recipientEmail;
    private String status;
    private String message;

    public EmailDispatchResult() {
    }

    public EmailDispatchResult(Long recordId, String employeeCode, String recipientEmail, String status, String message) {
        this.recordId = recordId;
        this.employeeCode = employeeCode;
        this.recipientEmail = recipientEmail;
        this.status = status;
        this.message = message;
    }

    public Long getRecordId() {
        return recordId;
    }

    public void setRecordId(Long recordId) {
        this.recordId = recordId;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

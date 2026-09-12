package com.payrollpro.dto;

public class EmailDispatchSummary {

    private Long payrollRunId;
    private int totalRecords;
    private int successCount;
    private int simulatedCount;
    private int failedCount;
    private String status;

    public EmailDispatchSummary() {
    }

    public EmailDispatchSummary(Long payrollRunId, int totalRecords, int successCount, int simulatedCount, int failedCount, String status) {
        this.payrollRunId = payrollRunId;
        this.totalRecords = totalRecords;
        this.successCount = successCount;
        this.simulatedCount = simulatedCount;
        this.failedCount = failedCount;
        this.status = status;
    }

    public Long getPayrollRunId() {
        return payrollRunId;
    }

    public void setPayrollRunId(Long payrollRunId) {
        this.payrollRunId = payrollRunId;
    }

    public int getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(int totalRecords) {
        this.totalRecords = totalRecords;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getSimulatedCount() {
        return simulatedCount;
    }

    public void setSimulatedCount(int simulatedCount) {
        this.simulatedCount = simulatedCount;
    }

    public int getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(int failedCount) {
        this.failedCount = failedCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

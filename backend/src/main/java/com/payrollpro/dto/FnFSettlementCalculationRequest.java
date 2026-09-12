package com.payrollpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FnFSettlementCalculationRequest {
    private Long employeeId;
    private LocalDate resignationDate;
    private LocalDate lastWorkingDate;
    private Integer noticePeriodDays = 30;
    private Integer servedDays = 30;
    private BigDecimal otherAdditions = BigDecimal.ZERO;
    private BigDecimal otherDeductions = BigDecimal.ZERO;
    private String remarks;

    public FnFSettlementCalculationRequest() {
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

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}

package com.payrollpro.dto;

import java.math.BigDecimal;

public class StatutorySummaryResponse {
    private Long payrollRunId;
    private int totalEmployees;
    private int epfEligibleCount;
    private BigDecimal totalEpfWages;
    private BigDecimal totalEeEpfContribution;
    private BigDecimal totalErEpfContribution;
    private BigDecimal totalEpsContribution;
    private int esicEligibleCount;
    private BigDecimal totalEsicWages;
    private BigDecimal totalEeEsicContribution;
    private BigDecimal totalErEsicContribution;

    public StatutorySummaryResponse() {
    }

    public Long getPayrollRunId() {
        return payrollRunId;
    }

    public void setPayrollRunId(Long payrollRunId) {
        this.payrollRunId = payrollRunId;
    }

    public int getTotalEmployees() {
        return totalEmployees;
    }

    public void setTotalEmployees(int totalEmployees) {
        this.totalEmployees = totalEmployees;
    }

    public int getEpfEligibleCount() {
        return epfEligibleCount;
    }

    public void setEpfEligibleCount(int epfEligibleCount) {
        this.epfEligibleCount = epfEligibleCount;
    }

    public BigDecimal getTotalEpfWages() {
        return totalEpfWages;
    }

    public void setTotalEpfWages(BigDecimal totalEpfWages) {
        this.totalEpfWages = totalEpfWages;
    }

    public BigDecimal getTotalEeEpfContribution() {
        return totalEeEpfContribution;
    }

    public void setTotalEeEpfContribution(BigDecimal totalEeEpfContribution) {
        this.totalEeEpfContribution = totalEeEpfContribution;
    }

    public BigDecimal getTotalErEpfContribution() {
        return totalErEpfContribution;
    }

    public void setTotalErEpfContribution(BigDecimal totalErEpfContribution) {
        this.totalErEpfContribution = totalErEpfContribution;
    }

    public BigDecimal getTotalEpsContribution() {
        return totalEpsContribution;
    }

    public void setTotalEpsContribution(BigDecimal totalEpsContribution) {
        this.totalEpsContribution = totalEpsContribution;
    }

    public int getEsicEligibleCount() {
        return esicEligibleCount;
    }

    public void setEsicEligibleCount(int esicEligibleCount) {
        this.esicEligibleCount = esicEligibleCount;
    }

    public BigDecimal getTotalEsicWages() {
        return totalEsicWages;
    }

    public void setTotalEsicWages(BigDecimal totalEsicWages) {
        this.totalEsicWages = totalEsicWages;
    }

    public BigDecimal getTotalEeEsicContribution() {
        return totalEeEsicContribution;
    }

    public void setTotalEeEsicContribution(BigDecimal totalEeEsicContribution) {
        this.totalEeEsicContribution = totalEeEsicContribution;
    }

    public BigDecimal getTotalErEsicContribution() {
        return totalErEsicContribution;
    }

    public void setTotalErEsicContribution(BigDecimal totalErEsicContribution) {
        this.totalErEsicContribution = totalErEsicContribution;
    }
}

package com.payrollpro.dto;

import com.payrollpro.model.FnFSettlementStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FnFSettlementResponse {
    private Long id;
    private Long employeeId;
    private String empCode;
    private String employeeName;
    private String department;
    private LocalDate dateOfJoining;
    private LocalDate resignationDate;
    private LocalDate lastWorkingDate;
    private int completedYearsOfService;
    private Integer noticePeriodDays;
    private Integer servedDays;
    private BigDecimal basicSalary;
    private BigDecimal grossSalary;
    private BigDecimal leaveEncashmentDays;
    private BigDecimal leaveEncashmentAmount;
    private BigDecimal gratuityAmount;
    private BigDecimal noticeRecoveryAmount;
    private BigDecimal otherAdditions;
    private BigDecimal otherDeductions;
    private BigDecimal netSettlementAmount;
    private FnFSettlementStatus status;
    private String remarks;
    private LocalDateTime createdAt;

    public FnFSettlementResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public LocalDate getDateOfJoining() {
        return dateOfJoining;
    }

    public void setDateOfJoining(LocalDate dateOfJoining) {
        this.dateOfJoining = dateOfJoining;
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

    public int getCompletedYearsOfService() {
        return completedYearsOfService;
    }

    public void setCompletedYearsOfService(int completedYearsOfService) {
        this.completedYearsOfService = completedYearsOfService;
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

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getGrossSalary() {
        return grossSalary;
    }

    public void setGrossSalary(BigDecimal grossSalary) {
        this.grossSalary = grossSalary;
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

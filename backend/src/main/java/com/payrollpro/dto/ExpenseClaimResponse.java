package com.payrollpro.dto;

import com.payrollpro.model.Employee;
import com.payrollpro.model.ExpenseCategory;
import com.payrollpro.model.ExpenseClaim;
import com.payrollpro.model.ExpenseClaimStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExpenseClaimResponse {

    private Long id;
    private Long companyId;
    private Long employeeId;
    private String employeeName;
    private String empCode;
    private LocalDate claimDate;
    private ExpenseCategory category;
    private BigDecimal amount;
    private String merchant;
    private String description;
    private String receiptUrl;
    private ExpenseClaimStatus status;
    private LocalDateTime approvedAt;
    private String remarks;
    private LocalDateTime createdAt;

    public ExpenseClaimResponse() {
    }

    public ExpenseClaimResponse(ExpenseClaim claim) {
        this(claim, null);
    }

    public ExpenseClaimResponse(ExpenseClaim claim, Employee employee) {
        if (claim != null) {
            this.id = claim.getId();
            this.companyId = claim.getCompanyId();
            this.employeeId = claim.getEmployeeId();
            this.claimDate = claim.getClaimDate();
            this.category = claim.getCategory();
            this.amount = claim.getAmount();
            this.merchant = claim.getMerchant();
            this.description = claim.getDescription();
            this.receiptUrl = claim.getReceiptUrl();
            this.status = claim.getStatus();
            this.approvedAt = claim.getApprovedAt();
            this.remarks = claim.getRemarks();
            this.createdAt = claim.getCreatedAt();
        }
        if (employee != null) {
            this.employeeName = employee.getFirstName() + " " + employee.getLastName();
            this.empCode = employee.getEmpCode();
        }
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

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public LocalDate getClaimDate() {
        return claimDate;
    }

    public void setClaimDate(LocalDate claimDate) {
        this.claimDate = claimDate;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public void setCategory(ExpenseCategory category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getMerchant() {
        return merchant;
    }

    public void setMerchant(String merchant) {
        this.merchant = merchant;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReceiptUrl() {
        return receiptUrl;
    }

    public void setReceiptUrl(String receiptUrl) {
        this.receiptUrl = receiptUrl;
    }

    public ExpenseClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ExpenseClaimStatus status) {
        this.status = status;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
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

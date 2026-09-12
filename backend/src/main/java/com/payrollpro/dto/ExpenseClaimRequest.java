package com.payrollpro.dto;

import com.payrollpro.model.ExpenseCategory;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseClaimRequest {

    private Long employeeId;
    private LocalDate claimDate;
    private ExpenseCategory category;
    private BigDecimal amount;
    private String merchant;
    private String description;
    private String receiptUrl;
    private String remarks;

    public ExpenseClaimRequest() {
    }

    public ExpenseClaimRequest(Long employeeId, LocalDate claimDate, ExpenseCategory category,
                               BigDecimal amount, String merchant, String description, String receiptUrl) {
        this.employeeId = employeeId;
        this.claimDate = claimDate;
        this.category = category;
        this.amount = amount;
        this.merchant = merchant;
        this.description = description;
        this.receiptUrl = receiptUrl;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
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

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}

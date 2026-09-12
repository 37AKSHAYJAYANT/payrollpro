package com.payrollpro.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BankValidationSummary {
    private int totalRecords;
    private int validRecords;
    private int invalidRecords;
    private BigDecimal totalPayout = BigDecimal.ZERO;
    private List<BankValidationError> errors = new ArrayList<>();

    public BankValidationSummary() {
    }

    public BankValidationSummary(int totalRecords, int validRecords, int invalidRecords, BigDecimal totalPayout, List<BankValidationError> errors) {
        this.totalRecords = totalRecords;
        this.validRecords = validRecords;
        this.invalidRecords = invalidRecords;
        this.totalPayout = totalPayout;
        this.errors = errors;
    }

    public int getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(int totalRecords) {
        this.totalRecords = totalRecords;
    }

    public int getValidRecords() {
        return validRecords;
    }

    public void setValidRecords(int validRecords) {
        this.validRecords = validRecords;
    }

    public int getInvalidRecords() {
        return invalidRecords;
    }

    public void setInvalidRecords(int invalidRecords) {
        this.invalidRecords = invalidRecords;
    }

    public BigDecimal getTotalPayout() {
        return totalPayout;
    }

    public void setTotalPayout(BigDecimal totalPayout) {
        this.totalPayout = totalPayout;
    }

    public List<BankValidationError> getErrors() {
        return errors;
    }

    public void setErrors(List<BankValidationError> errors) {
        this.errors = errors;
    }
}

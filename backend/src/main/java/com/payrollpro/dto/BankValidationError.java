package com.payrollpro.dto;

public class BankValidationError {
    private String empCode;
    private String employeeName;
    private String issue;

    public BankValidationError() {
    }

    public BankValidationError(String empCode, String employeeName, String issue) {
        this.empCode = empCode;
        this.employeeName = employeeName;
        this.issue = issue;
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

    public String getIssue() {
        return issue;
    }

    public void setIssue(String issue) {
        this.issue = issue;
    }
}

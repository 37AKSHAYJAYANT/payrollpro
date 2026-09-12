package com.payrollpro.dto;

import com.payrollpro.model.Employee;
import com.payrollpro.model.VariablePayRecord;
import com.payrollpro.model.VariablePayType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VariablePayResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String empCode;
    private String department;
    private Integer month;
    private Integer year;
    private VariablePayType type;
    private BigDecimal amount;
    private String remarks;
    private LocalDateTime createdAt;

    public VariablePayResponse() {
    }

    public VariablePayResponse(VariablePayRecord record, Employee employee) {
        if (record != null) {
            this.id = record.getId();
            this.employeeId = record.getEmployeeId();
            this.month = record.getMonth();
            this.year = record.getYear();
            this.type = record.getType();
            this.amount = record.getAmount();
            this.remarks = record.getRemarks();
            this.createdAt = record.getCreatedAt();
        }
        if (employee != null) {
            this.employeeName = employee.getFirstName() + " " + employee.getLastName();
            this.empCode = employee.getEmpCode();
            this.department = employee.getDepartment();
        }
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

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public VariablePayType getType() {
        return type;
    }

    public void setType(VariablePayType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
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

package com.payrollpro.dto;

import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeResponse {

    private Long id;
    private Long companyId;
    private String empCode;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String department;
    private String designation;
    private LocalDate dateOfJoining;
    private LocalDate dateOfExit;
    private String panNumber;
    private String aadhaarNumber;
    private String bankAccountNumber;
    private String ifscCode;
    private String bankName;
    private EmployeeStatus status;
    private LocalDateTime createdAt;

    // ---- Constructors ----

    public EmployeeResponse() {
    }

    public EmployeeResponse(Employee emp) {
        this.id = emp.getId();
        this.companyId = emp.getCompanyId();
        this.empCode = emp.getEmpCode();
        this.firstName = emp.getFirstName();
        this.lastName = emp.getLastName();
        this.email = emp.getEmail();
        this.phone = emp.getPhone();
        this.department = emp.getDepartment();
        this.designation = emp.getDesignation();
        this.dateOfJoining = emp.getDateOfJoining();
        this.dateOfExit = emp.getDateOfExit();
        this.panNumber = emp.getPanNumber();
        this.aadhaarNumber = emp.getAadhaarNumber();
        this.bankAccountNumber = emp.getBankAccountNumber();
        this.ifscCode = emp.getIfscCode();
        this.bankName = emp.getBankName();
        this.status = emp.getStatus();
        this.createdAt = emp.getCreatedAt();
    }

    // ---- Getters and Setters ----

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

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public LocalDate getDateOfJoining() {
        return dateOfJoining;
    }

    public void setDateOfJoining(LocalDate dateOfJoining) {
        this.dateOfJoining = dateOfJoining;
    }

    public LocalDate getDateOfExit() {
        return dateOfExit;
    }

    public void setDateOfExit(LocalDate dateOfExit) {
        this.dateOfExit = dateOfExit;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = aadhaarNumber;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public EmployeeStatus getStatus() {
        return status;
    }

    public void setStatus(EmployeeStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

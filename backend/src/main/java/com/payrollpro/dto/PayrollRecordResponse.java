package com.payrollpro.dto;

import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import java.math.BigDecimal;

public class PayrollRecordResponse {

    private Long id;
    private Long payrollRunId;
    private Long employeeId;
    private String employeeName;
    private String empCode;
    private String department;
    private String designation;
    private String panNumber;
    private String bankName;
    private String bankAccountNumber;
    private Integer month;
    private Integer year;
    private String payslipRef;
    private Integer totalWorkingDays;
    private BigDecimal payableDays;
    private BigDecimal basicEarned;
    private BigDecimal hraEarned;
    private BigDecimal specialAllowanceEarned;
    private BigDecimal grossEarned;
    private BigDecimal epfDeduction;
    private BigDecimal professionalTax;
    private BigDecimal tdsDeduction;
    private BigDecimal totalDeductions;
    private BigDecimal netPay;
    private boolean isAnomaly;

    // ---- Constructors ----

    public PayrollRecordResponse() {
    }

    public PayrollRecordResponse(PayrollRecord r, Employee emp) {
        this.id = r.getId();
        this.payrollRunId = r.getPayrollRunId();
        this.employeeId = r.getEmployeeId();
        this.month = r.getMonth();
        this.year = r.getYear();
        this.payslipRef = r.getPayslipRef();
        this.totalWorkingDays = r.getTotalWorkingDays();
        this.payableDays = r.getPayableDays();
        this.basicEarned = r.getBasicEarned();
        this.hraEarned = r.getHraEarned();
        this.specialAllowanceEarned = r.getSpecialAllowanceEarned();
        this.grossEarned = r.getGrossEarned();
        this.epfDeduction = r.getEpfDeduction();
        this.professionalTax = r.getProfessionalTax();
        this.tdsDeduction = r.getTdsDeduction();
        this.totalDeductions = r.getTotalDeductions();
        this.netPay = r.getNetPay();

        // Flag anomaly if netPay <= 0 or zero payable days
        this.isAnomaly = (r.getNetPay().compareTo(BigDecimal.ZERO) <= 0) ||
                (r.getPayableDays().compareTo(BigDecimal.ZERO) == 0);

        if (emp != null) {
            this.employeeName = emp.getFirstName() + " " + emp.getLastName();
            this.empCode = emp.getEmpCode();
            this.department = emp.getDepartment();
            this.designation = emp.getDesignation();
            this.panNumber = emp.getPanNumber();
            this.bankName = emp.getBankName();
            this.bankAccountNumber = emp.getBankAccountNumber();
        }
    }

    // ---- Getters and Setters ----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPayrollRunId() {
        return payrollRunId;
    }

    public void setPayrollRunId(Long payrollRunId) {
        this.payrollRunId = payrollRunId;
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

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
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

    public String getPayslipRef() {
        return payslipRef;
    }

    public void setPayslipRef(String payslipRef) {
        this.payslipRef = payslipRef;
    }

    public Integer getTotalWorkingDays() {
        return totalWorkingDays;
    }

    public void setTotalWorkingDays(Integer totalWorkingDays) {
        this.totalWorkingDays = totalWorkingDays;
    }

    public BigDecimal getPayableDays() {
        return payableDays;
    }

    public void setPayableDays(BigDecimal payableDays) {
        this.payableDays = payableDays;
    }

    public BigDecimal getBasicEarned() {
        return basicEarned;
    }

    public void setBasicEarned(BigDecimal basicEarned) {
        this.basicEarned = basicEarned;
    }

    public BigDecimal getHraEarned() {
        return hraEarned;
    }

    public void setHraEarned(BigDecimal hraEarned) {
        this.hraEarned = hraEarned;
    }

    public BigDecimal getSpecialAllowanceEarned() {
        return specialAllowanceEarned;
    }

    public void setSpecialAllowanceEarned(BigDecimal specialAllowanceEarned) {
        this.specialAllowanceEarned = specialAllowanceEarned;
    }

    public BigDecimal getGrossEarned() {
        return grossEarned;
    }

    public void setGrossEarned(BigDecimal grossEarned) {
        this.grossEarned = grossEarned;
    }

    public BigDecimal getEpfDeduction() {
        return epfDeduction;
    }

    public void setEpfDeduction(BigDecimal epfDeduction) {
        this.epfDeduction = epfDeduction;
    }

    public BigDecimal getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(BigDecimal professionalTax) {
        this.professionalTax = professionalTax;
    }

    public BigDecimal getTdsDeduction() {
        return tdsDeduction;
    }

    public void setTdsDeduction(BigDecimal tdsDeduction) {
        this.tdsDeduction = tdsDeduction;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public BigDecimal getNetPay() {
        return netPay;
    }

    public void setNetPay(BigDecimal netPay) {
        this.netPay = netPay;
    }

    public boolean isAnomaly() {
        return isAnomaly;
    }

    public void setAnomaly(boolean anomaly) {
        isAnomaly = anomaly;
    }
}

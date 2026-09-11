package com.payrollpro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;

@Entity
@Table(name = "payroll_records", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "employeeId", "record_year", "record_month"})
})
public class PayrollRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long payrollRunId;

    @Column(nullable = false)
    private Long employeeId;

    @Column(name = "record_month", nullable = false)
    private Integer month;

    @Column(name = "record_year", nullable = false)
    private Integer year;

    @Column(nullable = false, unique = true, length = 50)
    private String payslipRef;

    @Column(nullable = false)
    private Integer totalWorkingDays;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal payableDays;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basicEarned;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hraEarned;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal specialAllowanceEarned;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal grossEarned;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal epfDeduction;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal professionalTax;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal tdsDeduction;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalDeductions;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal netPay;

    // ---- Constructors ----

    public PayrollRecord() {
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
}

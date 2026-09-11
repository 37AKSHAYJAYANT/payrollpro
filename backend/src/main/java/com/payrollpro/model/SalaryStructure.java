package com.payrollpro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "salary_structures", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "employeeId"})
})
public class SalaryStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal annualCTC;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyGross;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basicSalary;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hra;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal specialAllowance;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal epfEmployee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal epfEmployer;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal professionalTax;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyTds;

    @Column(nullable = false)
    private LocalDate effectiveFrom;

    // ---- Constructors ----

    public SalaryStructure() {
    }

    public SalaryStructure(Long companyId, Long employeeId, BigDecimal annualCTC,
                           BigDecimal monthlyGross, BigDecimal basicSalary, BigDecimal hra,
                           BigDecimal specialAllowance, BigDecimal epfEmployee, BigDecimal epfEmployer,
                           BigDecimal professionalTax, BigDecimal monthlyTds, LocalDate effectiveFrom) {
        this.companyId = companyId;
        this.employeeId = employeeId;
        this.annualCTC = annualCTC;
        this.monthlyGross = monthlyGross;
        this.basicSalary = basicSalary;
        this.hra = hra;
        this.specialAllowance = specialAllowance;
        this.epfEmployee = epfEmployee;
        this.epfEmployer = epfEmployer;
        this.professionalTax = professionalTax;
        this.monthlyTds = monthlyTds;
        this.effectiveFrom = effectiveFrom;
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

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public BigDecimal getAnnualCTC() {
        return annualCTC;
    }

    public void setAnnualCTC(BigDecimal annualCTC) {
        this.annualCTC = annualCTC;
    }

    public BigDecimal getMonthlyGross() {
        return monthlyGross;
    }

    public void setMonthlyGross(BigDecimal monthlyGross) {
        this.monthlyGross = monthlyGross;
    }

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getHra() {
        return hra;
    }

    public void setHra(BigDecimal hra) {
        this.hra = hra;
    }

    public BigDecimal getSpecialAllowance() {
        return specialAllowance;
    }

    public void setSpecialAllowance(BigDecimal specialAllowance) {
        this.specialAllowance = specialAllowance;
    }

    public BigDecimal getEpfEmployee() {
        return epfEmployee;
    }

    public void setEpfEmployee(BigDecimal epfEmployee) {
        this.epfEmployee = epfEmployee;
    }

    public BigDecimal getEpfEmployer() {
        return epfEmployer;
    }

    public void setEpfEmployer(BigDecimal epfEmployer) {
        this.epfEmployer = epfEmployer;
    }

    public BigDecimal getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(BigDecimal professionalTax) {
        this.professionalTax = professionalTax;
    }

    public BigDecimal getMonthlyTds() {
        return monthlyTds;
    }

    public void setMonthlyTds(BigDecimal monthlyTds) {
        this.monthlyTds = monthlyTds;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }
}

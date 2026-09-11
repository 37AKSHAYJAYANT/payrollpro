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
@Table(name = "leave_balances", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "employeeId", "leaveTypeId", "leave_year"})
})
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private Long leaveTypeId;

    @Column(name = "leave_year", nullable = false)
    private Integer year;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal totalBalance;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal used = BigDecimal.ZERO;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal remaining;

    // ---- Constructors ----

    public LeaveBalance() {
    }

    public LeaveBalance(Long companyId, Long employeeId, Long leaveTypeId, Integer year, BigDecimal totalBalance) {
        this.companyId = companyId;
        this.employeeId = employeeId;
        this.leaveTypeId = leaveTypeId;
        this.year = year;
        this.totalBalance = totalBalance;
        this.used = BigDecimal.ZERO;
        this.remaining = totalBalance;
    }

    // ---- Helper method ----
    public void deduct(BigDecimal days) {
        this.used = this.used.add(days);
        this.remaining = this.totalBalance.subtract(this.used);
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

    public Long getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(Long leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getTotalBalance() {
        return totalBalance;
    }

    public void setTotalBalance(BigDecimal totalBalance) {
        this.totalBalance = totalBalance;
    }

    public BigDecimal getUsed() {
        return used;
    }

    public void setUsed(BigDecimal used) {
        this.used = used;
    }

    public BigDecimal getRemaining() {
        return remaining;
    }

    public void setRemaining(BigDecimal remaining) {
        this.remaining = remaining;
    }
}

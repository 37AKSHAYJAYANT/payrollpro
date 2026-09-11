package com.payrollpro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;

@Entity
@Table(name = "attendances", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "employeeId", "att_year", "att_month"})
})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long employeeId;

    @Column(name = "att_month", nullable = false)
    private Integer month;

    @Column(name = "att_year", nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer totalWorkingDays;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal presentDays;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal paidLeaveDays = BigDecimal.ZERO;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal unpaidLeaveDays = BigDecimal.ZERO;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal payableDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceSource source = AttendanceSource.MANUAL;

    // ---- Constructors ----

    public Attendance() {
    }

    public Attendance(Long companyId, Long employeeId, Integer month, Integer year,
                      Integer totalWorkingDays, BigDecimal presentDays, BigDecimal paidLeaveDays,
                      BigDecimal unpaidLeaveDays, BigDecimal payableDays, AttendanceSource source) {
        this.companyId = companyId;
        this.employeeId = employeeId;
        this.month = month;
        this.year = year;
        this.totalWorkingDays = totalWorkingDays;
        this.presentDays = presentDays;
        this.paidLeaveDays = paidLeaveDays != null ? paidLeaveDays : BigDecimal.ZERO;
        this.unpaidLeaveDays = unpaidLeaveDays != null ? unpaidLeaveDays : BigDecimal.ZERO;
        this.payableDays = payableDays;
        this.source = source != null ? source : AttendanceSource.MANUAL;
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

    public Integer getTotalWorkingDays() {
        return totalWorkingDays;
    }

    public void setTotalWorkingDays(Integer totalWorkingDays) {
        this.totalWorkingDays = totalWorkingDays;
    }

    public BigDecimal getPresentDays() {
        return presentDays;
    }

    public void setPresentDays(BigDecimal presentDays) {
        this.presentDays = presentDays;
    }

    public BigDecimal getPaidLeaveDays() {
        return paidLeaveDays;
    }

    public void setPaidLeaveDays(BigDecimal paidLeaveDays) {
        this.paidLeaveDays = paidLeaveDays;
    }

    public BigDecimal getUnpaidLeaveDays() {
        return unpaidLeaveDays;
    }

    public void setUnpaidLeaveDays(BigDecimal unpaidLeaveDays) {
        this.unpaidLeaveDays = unpaidLeaveDays;
    }

    public BigDecimal getPayableDays() {
        return payableDays;
    }

    public void setPayableDays(BigDecimal payableDays) {
        this.payableDays = payableDays;
    }

    public AttendanceSource getSource() {
        return source;
    }

    public void setSource(AttendanceSource source) {
        this.source = source;
    }
}

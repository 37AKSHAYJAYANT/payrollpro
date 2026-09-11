package com.payrollpro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "leave_types", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "code"})
})
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false)
    private Integer annualQuota;

    @Column(nullable = false)
    private Boolean carryForward = false;

    // ---- Constructors ----

    public LeaveType() {
    }

    public LeaveType(Long companyId, String name, String code, Integer annualQuota, Boolean carryForward) {
        this.companyId = companyId;
        this.name = name;
        this.code = code;
        this.annualQuota = annualQuota;
        this.carryForward = carryForward != null ? carryForward : false;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Integer getAnnualQuota() {
        return annualQuota;
    }

    public void setAnnualQuota(Integer annualQuota) {
        this.annualQuota = annualQuota;
    }

    public Boolean getCarryForward() {
        return carryForward;
    }

    public void setCarryForward(Boolean carryForward) {
        this.carryForward = carryForward;
    }
}

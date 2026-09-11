package com.payrollpro.dto;

public class AuthResponse {

    private String token;
    private String role;
    private Long companyId;

    // ---- Constructors ----

    public AuthResponse() {
    }

    public AuthResponse(String token, String role, Long companyId) {
        this.token = token;
        this.role = role;
        this.companyId = companyId;
    }

    // ---- Getters and Setters ----

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }
}

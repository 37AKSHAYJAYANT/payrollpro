package com.payrollpro.dto;

public class AuthResponse {

    private String token;
    private String role;
    private Long companyId;
    private String companyName;
    private String email;

    // ---- Constructors ----

    public AuthResponse() {
    }

    public AuthResponse(String token, String role, Long companyId) {
        this.token = token;
        this.role = role;
        this.companyId = companyId;
    }

    public AuthResponse(String token, String role, Long companyId, String companyName, String email) {
        this.token = token;
        this.role = role;
        this.companyId = companyId;
        this.companyName = companyName;
        this.email = email;
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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

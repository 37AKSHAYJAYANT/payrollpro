package com.payrollpro.config;

public class TenantContext {

    private static final ThreadLocal<Long> currentCompanyId = new ThreadLocal<>();

    public static void setCompanyId(Long companyId) {
        currentCompanyId.set(companyId);
    }

    public static Long getCompanyId() {
        return currentCompanyId.get();
    }

    public static Long getRequiredCompanyId() {
        Long companyId = currentCompanyId.get();
        if (companyId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        return companyId;
    }

    public static void clear() {
        currentCompanyId.remove();
    }
}

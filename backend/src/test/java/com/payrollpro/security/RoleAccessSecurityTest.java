package com.payrollpro.security;

import com.payrollpro.config.JwtUtil;
import com.payrollpro.dto.LoginRequest;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.Role;
import com.payrollpro.model.User;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RoleAccessSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("Unauthenticated Request - Rejects with 401 Unauthorized or 403 Forbidden")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Employee Token attempting Admin API - Rejects with 403 Forbidden")
    void testEmployeeAccessToAdminApiForbidden() throws Exception {
        // Generate JWT for EMPLOYEE role
        String employeeToken = jwtUtil.generateToken(4L, 1L, "EMPLOYEE", "emp001@democompany.com");

        mockMvc.perform(post("/api/payroll/run?month=9&year=2026")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Employee Token accessing My Payslips - Allowed (200 OK)")
    void testEmployeeAccessToSelfServiceAllowed() throws Exception {
        String employeeToken = jwtUtil.generateToken(4L, 1L, "EMPLOYEE", "emp001@democompany.com");

        mockMvc.perform(get("/api/payslips/my")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Company Admin Execute Payroll Run and Re-run")
    void testCompanyAdminExecutePayrollRun() throws Exception {
        String hrToken = jwtUtil.generateToken(2L, 1L, "COMPANY_ADMIN", "hr@democompany.com");

        mockMvc.perform(post("/api/payroll/run?month=9&year=2026")
                        .header("Authorization", "Bearer " + hrToken))
                .andExpect(status().isCreated());

        // Re-run the same month & year to verify re-run logic
        mockMvc.perform(post("/api/payroll/run?month=9&year=2026")
                        .header("Authorization", "Bearer " + hrToken))
                .andExpect(status().isCreated());
    }
}

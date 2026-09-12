package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.ExpenseClaimRequest;
import com.payrollpro.dto.ExpenseClaimResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.ExpenseCategory;
import com.payrollpro.model.ExpenseClaim;
import com.payrollpro.model.ExpenseClaimStatus;
import com.payrollpro.model.User;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.ExpenseClaimRepository;
import com.payrollpro.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseClaimServiceTest {

    @Mock
    private ExpenseClaimRepository expenseClaimRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExpenseClaimService expenseClaimService;

    private final Long companyId = 1L;
    private final Long employeeId = 10L;

    private Employee employee;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(companyId);

        employee = new Employee();
        employee.setId(employeeId);
        employee.setCompanyId(companyId);
        employee.setEmpCode("EMP-010");
        employee.setFirstName("Rohan");
        employee.setLastName("Verma");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Submit Claim - Successfully creates claim with PENDING status")
    void testSubmitClaim_Success() {
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId)).thenReturn(Optional.of(employee));
        when(expenseClaimRepository.save(any(ExpenseClaim.class))).thenAnswer(inv -> {
            ExpenseClaim c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });

        ExpenseClaimRequest request = new ExpenseClaimRequest();
        request.setEmployeeId(employeeId);
        request.setCategory(ExpenseCategory.TRAVEL);
        request.setAmount(new BigDecimal("1500.00"));
        request.setClaimDate(LocalDate.of(2026, 9, 10));
        request.setMerchant("Uber India");
        request.setDescription("Travel to client office");
        request.setReceiptUrl("https://storage.payrollpro.com/receipts/rec1.pdf");

        ExpenseClaimResponse response = expenseClaimService.submitClaim(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(companyId, response.getCompanyId());
        assertEquals(employeeId, response.getEmployeeId());
        assertEquals("Rohan Verma", response.getEmployeeName());
        assertEquals("EMP-010", response.getEmpCode());
        assertEquals(ExpenseCategory.TRAVEL, response.getCategory());
        assertEquals(new BigDecimal("1500.00"), response.getAmount());
        assertEquals(ExpenseClaimStatus.PENDING, response.getStatus());
        assertEquals("Uber India", response.getMerchant());
        assertEquals("Travel to client office", response.getDescription());
        assertEquals("https://storage.payrollpro.com/receipts/rec1.pdf", response.getReceiptUrl());
    }

    @Test
    @DisplayName("Submit Claim - Throws BAD_REQUEST when amount is non-positive or null")
    void testSubmitClaim_InvalidAmount_ThrowsBadRequest() {
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId)).thenReturn(Optional.of(employee));

        ExpenseClaimRequest request = new ExpenseClaimRequest();
        request.setEmployeeId(employeeId);
        request.setCategory(ExpenseCategory.MEALS);
        request.setAmount(BigDecimal.ZERO);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> expenseClaimService.submitClaim(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Amount must be greater than zero"));
    }

    @Test
    @DisplayName("Submit Claim - Throws BAD_REQUEST when category is missing")
    void testSubmitClaim_MissingCategory_ThrowsBadRequest() {
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId)).thenReturn(Optional.of(employee));

        ExpenseClaimRequest request = new ExpenseClaimRequest();
        request.setEmployeeId(employeeId);
        request.setAmount(new BigDecimal("500.00"));
        request.setCategory(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> expenseClaimService.submitClaim(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Expense category is required"));
    }

    @Test
    @DisplayName("Submit Claim - Throws NOT_FOUND when employee does not exist")
    void testSubmitClaim_EmployeeNotFound_ThrowsNotFound() {
        when(employeeRepository.findByCompanyIdAndId(companyId, 999L)).thenReturn(Optional.empty());

        ExpenseClaimRequest request = new ExpenseClaimRequest();
        request.setEmployeeId(999L);
        request.setCategory(ExpenseCategory.FUEL);
        request.setAmount(new BigDecimal("800.00"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> expenseClaimService.submitClaim(request));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("Approve Claim - Transitions status to APPROVED and sets approvedAt")
    void testApproveClaim_Success() {
        ExpenseClaim claim = new ExpenseClaim();
        claim.setId(101L);
        claim.setCompanyId(companyId);
        claim.setEmployeeId(employeeId);
        claim.setCategory(ExpenseCategory.BROADBAND);
        claim.setAmount(new BigDecimal("1200.00"));
        claim.setStatus(ExpenseClaimStatus.PENDING);

        when(expenseClaimRepository.findByCompanyIdAndId(companyId, 101L)).thenReturn(Optional.of(claim));
        when(expenseClaimRepository.save(any(ExpenseClaim.class))).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId)).thenReturn(Optional.of(employee));

        ExpenseClaimResponse response = expenseClaimService.approveClaim(101L, "Approved by Manager");

        assertNotNull(response);
        assertEquals(ExpenseClaimStatus.APPROVED, response.getStatus());
        assertNotNull(response.getApprovedAt());
        assertEquals("Approved by Manager", response.getRemarks());
    }

    @Test
    @DisplayName("Approve Claim - Throws BAD_REQUEST when claim is not in PENDING status")
    void testApproveClaim_NotPending_ThrowsBadRequest() {
        ExpenseClaim claim = new ExpenseClaim();
        claim.setId(102L);
        claim.setCompanyId(companyId);
        claim.setStatus(ExpenseClaimStatus.APPROVED);

        when(expenseClaimRepository.findByCompanyIdAndId(companyId, 102L)).thenReturn(Optional.of(claim));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> expenseClaimService.approveClaim(102L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Only PENDING claims can be approved"));
    }

    @Test
    @DisplayName("Reject Claim - Transitions status to REJECTED and records remarks")
    void testRejectClaim_Success() {
        ExpenseClaim claim = new ExpenseClaim();
        claim.setId(103L);
        claim.setCompanyId(companyId);
        claim.setEmployeeId(employeeId);
        claim.setCategory(ExpenseCategory.OTHER);
        claim.setAmount(new BigDecimal("5000.00"));
        claim.setStatus(ExpenseClaimStatus.PENDING);

        when(expenseClaimRepository.findByCompanyIdAndId(companyId, 103L)).thenReturn(Optional.of(claim));
        when(expenseClaimRepository.save(any(ExpenseClaim.class))).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId)).thenReturn(Optional.of(employee));

        ExpenseClaimResponse response = expenseClaimService.rejectClaim(103L, "Missing valid invoice");

        assertNotNull(response);
        assertEquals(ExpenseClaimStatus.REJECTED, response.getStatus());
        assertEquals("Missing valid invoice", response.getRemarks());
    }

    @Test
    @DisplayName("Reject Claim - Throws BAD_REQUEST when claim is not PENDING")
    void testRejectClaim_NotPending_ThrowsBadRequest() {
        ExpenseClaim claim = new ExpenseClaim();
        claim.setId(104L);
        claim.setCompanyId(companyId);
        claim.setStatus(ExpenseClaimStatus.REJECTED);

        when(expenseClaimRepository.findByCompanyIdAndId(companyId, 104L)).thenReturn(Optional.of(claim));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> expenseClaimService.rejectClaim(104L, "Already rejected"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Only PENDING claims can be rejected"));
    }

    @Test
    @DisplayName("Get Approved Claims For Month - Returns claims within month range")
    void testGetApprovedClaimsForMonth() {
        LocalDate startDate = LocalDate.of(2026, 9, 1);
        LocalDate endDate = LocalDate.of(2026, 9, 30);

        ExpenseClaim claim1 = new ExpenseClaim();
        claim1.setId(201L);
        claim1.setCompanyId(companyId);
        claim1.setEmployeeId(employeeId);
        claim1.setCategory(ExpenseCategory.TRAVEL);
        claim1.setAmount(new BigDecimal("2000.00"));
        claim1.setClaimDate(LocalDate.of(2026, 9, 15));
        claim1.setStatus(ExpenseClaimStatus.APPROVED);

        ExpenseClaim claim2 = new ExpenseClaim();
        claim2.setId(202L);
        claim2.setCompanyId(companyId);
        claim2.setEmployeeId(employeeId);
        claim2.setCategory(ExpenseCategory.MEALS);
        claim2.setAmount(new BigDecimal("800.00"));
        claim2.setClaimDate(LocalDate.of(2026, 9, 20));
        claim2.setStatus(ExpenseClaimStatus.APPROVED);

        when(expenseClaimRepository.findAllByCompanyIdAndEmployeeIdAndStatusAndClaimDateBetween(
                companyId, employeeId, ExpenseClaimStatus.APPROVED, startDate, endDate))
                .thenReturn(List.of(claim1, claim2));

        List<ExpenseClaim> results = expenseClaimService.getApprovedClaimsForMonth(companyId, employeeId, 9, 2026);

        assertEquals(2, results.size());
        assertEquals(new BigDecimal("2000.00"), results.get(0).getAmount());
        assertEquals(new BigDecimal("800.00"), results.get(1).getAmount());
    }

    @Test
    @DisplayName("Get My Claims - Retrieves claims for authenticated user's employee")
    void testGetMyClaims() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("emp@company.com", "pass"));

        User user = new User();
        user.setEmail("emp@company.com");
        user.setEmployeeId(employeeId);

        when(userRepository.findByEmail("emp@company.com")).thenReturn(Optional.of(user));
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId)).thenReturn(Optional.of(employee));

        ExpenseClaim claim = new ExpenseClaim();
        claim.setId(301L);
        claim.setCompanyId(companyId);
        claim.setEmployeeId(employeeId);
        claim.setCategory(ExpenseCategory.FUEL);
        claim.setAmount(new BigDecimal("950.00"));
        claim.setStatus(ExpenseClaimStatus.PENDING);

        when(expenseClaimRepository.findAllByCompanyIdAndEmployeeIdOrderByClaimDateDesc(companyId, employeeId))
                .thenReturn(List.of(claim));

        List<ExpenseClaimResponse> myClaims = expenseClaimService.getMyClaims();

        assertEquals(1, myClaims.size());
        assertEquals(new BigDecimal("950.00"), myClaims.get(0).getAmount());
        assertEquals("Rohan Verma", myClaims.get(0).getEmployeeName());
    }

    @Test
    @DisplayName("Get Pending Claims - Retrieves all pending claims in company")
    void testGetPendingClaims() {
        ExpenseClaim claim = new ExpenseClaim();
        claim.setId(401L);
        claim.setCompanyId(companyId);
        claim.setEmployeeId(employeeId);
        claim.setStatus(ExpenseClaimStatus.PENDING);

        when(expenseClaimRepository.findAllByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, ExpenseClaimStatus.PENDING))
                .thenReturn(List.of(claim));
        when(employeeRepository.findAllByCompanyId(companyId)).thenReturn(List.of(employee));

        List<ExpenseClaimResponse> pending = expenseClaimService.getPendingClaims();

        assertEquals(1, pending.size());
        assertEquals(ExpenseClaimStatus.PENDING, pending.get(0).getStatus());
        assertEquals("Rohan Verma", pending.get(0).getEmployeeName());
    }

    @Test
    @DisplayName("Tenant Isolation - Missing tenant context throws UNAUTHORIZED")
    void testMissingTenantThrowsUnauthorized() {
        TenantContext.clear();

        ExpenseClaimRequest req = new ExpenseClaimRequest();
        req.setAmount(new BigDecimal("100.00"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> expenseClaimService.submitClaim(req));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Tenant context missing"));
    }
}

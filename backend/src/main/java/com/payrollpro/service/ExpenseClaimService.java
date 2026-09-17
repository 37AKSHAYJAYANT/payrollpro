package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.ExpenseClaimRequest;
import com.payrollpro.dto.ExpenseClaimResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.ExpenseClaim;
import com.payrollpro.model.ExpenseClaimStatus;
import com.payrollpro.model.User;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.ExpenseClaimRepository;
import com.payrollpro.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExpenseClaimService {

    private final ExpenseClaimRepository expenseClaimRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public ExpenseClaimService(ExpenseClaimRepository expenseClaimRepository,
                               EmployeeRepository employeeRepository,
                               UserRepository userRepository) {
        this.expenseClaimRepository = expenseClaimRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    private Employee resolveClaimEmployee(Long companyId, Long requestEmployeeId) {
        if (requestEmployeeId != null) {
            return employeeRepository.findByCompanyIdAndId(companyId, requestEmployeeId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        }
        return com.payrollpro.util.SecurityUtils.getCurrentEmployeeWithFallback(userRepository, employeeRepository, companyId);
    }

    @Transactional
    public ExpenseClaimResponse submitClaim(ExpenseClaimRequest request) {
        Long companyId = getRequiredCompanyId();
        Employee employee = resolveClaimEmployee(companyId, request.getEmployeeId());

        if (request.getCategory() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expense category is required");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }

        LocalDate claimDate = request.getClaimDate() != null ? request.getClaimDate() : LocalDate.now();

        ExpenseClaim claim = new ExpenseClaim();
        claim.setCompanyId(companyId);
        claim.setEmployeeId(employee.getId());
        claim.setClaimDate(claimDate);
        claim.setCategory(request.getCategory());
        claim.setAmount(request.getAmount());
        claim.setMerchant(request.getMerchant());
        claim.setDescription(request.getDescription());
        claim.setReceiptUrl(request.getReceiptUrl());
        claim.setStatus(ExpenseClaimStatus.PENDING);
        claim.setRemarks(request.getRemarks());

        ExpenseClaim saved = expenseClaimRepository.save(claim);
        return new ExpenseClaimResponse(saved, employee);
    }

    public List<ExpenseClaimResponse> getMyClaims() {
        Long companyId = getRequiredCompanyId();
        java.util.Optional<Employee> empOpt = com.payrollpro.util.SecurityUtils.findCurrentEmployeeOptional(
                userRepository, employeeRepository, companyId);
        if (empOpt.isEmpty()) {
            return Collections.emptyList();
        }

        Employee employee = empOpt.get();
        return expenseClaimRepository.findAllByCompanyIdAndEmployeeIdOrderByClaimDateDesc(companyId, employee.getId()).stream()
                .map(claim -> new ExpenseClaimResponse(claim, employee))
                .collect(Collectors.toList());
    }

    public List<ExpenseClaimResponse> getPendingClaims() {
        Long companyId = getRequiredCompanyId();
        List<ExpenseClaim> claims = expenseClaimRepository.findAllByCompanyIdAndStatusOrderByCreatedAtDesc(
                companyId, ExpenseClaimStatus.PENDING);
        return mapClaimsWithEmployees(companyId, claims);
    }

    public List<ExpenseClaimResponse> getAllClaims() {
        Long companyId = getRequiredCompanyId();
        List<ExpenseClaim> claims = expenseClaimRepository.findAllByCompanyIdOrderByCreatedAtDesc(companyId);
        return mapClaimsWithEmployees(companyId, claims);
    }

    private List<ExpenseClaimResponse> mapClaimsWithEmployees(Long companyId, List<ExpenseClaim> claims) {
        if (claims.isEmpty()) {
            return Collections.emptyList();
        }
        java.util.Set<Long> empIds = claims.stream().map(ExpenseClaim::getEmployeeId).collect(Collectors.toSet());
        List<Employee> emps = employeeRepository.findByCompanyIdAndIdIn(companyId, empIds);
        if (emps == null || emps.isEmpty()) {
            emps = employeeRepository.findAllByCompanyId(companyId);
        }
        Map<Long, Employee> employeeMap = (emps != null ? emps : Collections.<Employee>emptyList()).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e, (e1, e2) -> e1));

        return claims.stream()
                .map(claim -> new ExpenseClaimResponse(claim, employeeMap.get(claim.getEmployeeId())))
                .collect(Collectors.toList());
    }

    public List<ExpenseClaimResponse> getClaimsForEmployee(Long employeeId) {
        Long companyId = getRequiredCompanyId();
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId).orElse(null);

        return expenseClaimRepository.findAllByCompanyIdAndEmployeeIdOrderByClaimDateDesc(companyId, employeeId).stream()
                .map(claim -> new ExpenseClaimResponse(claim, employee))
                .collect(Collectors.toList());
    }

    public ExpenseClaimResponse getClaimById(Long id) {
        Long companyId = getRequiredCompanyId();
        ExpenseClaim claim = expenseClaimRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense claim not found"));

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, claim.getEmployeeId()).orElse(null);
        return new ExpenseClaimResponse(claim, employee);
    }

    @Transactional
    public ExpenseClaimResponse approveClaim(Long id) {
        return approveClaim(id, null);
    }

    @Transactional
    public ExpenseClaimResponse approveClaim(Long id, String remarks) {
        Long companyId = getRequiredCompanyId();
        ExpenseClaim claim = expenseClaimRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense claim not found"));

        if (claim.getStatus() != ExpenseClaimStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot approve claim with status: " + claim.getStatus() + ". Only PENDING claims can be approved.");
        }

        claim.setStatus(ExpenseClaimStatus.APPROVED);
        claim.setApprovedAt(LocalDateTime.now());
        if (remarks != null && !remarks.isBlank()) {
            claim.setRemarks(remarks);
        }

        ExpenseClaim saved = expenseClaimRepository.save(claim);
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, saved.getEmployeeId()).orElse(null);
        return new ExpenseClaimResponse(saved, employee);
    }

    @Transactional
    public ExpenseClaimResponse rejectClaim(Long id) {
        return rejectClaim(id, null);
    }

    @Transactional
    public ExpenseClaimResponse rejectClaim(Long id, String remarks) {
        Long companyId = getRequiredCompanyId();
        ExpenseClaim claim = expenseClaimRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense claim not found"));

        if (claim.getStatus() != ExpenseClaimStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot reject claim with status: " + claim.getStatus() + ". Only PENDING claims can be rejected.");
        }

        claim.setStatus(ExpenseClaimStatus.REJECTED);
        if (remarks != null && !remarks.isBlank()) {
            claim.setRemarks(remarks);
        }

        ExpenseClaim saved = expenseClaimRepository.save(claim);
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, saved.getEmployeeId()).orElse(null);
        return new ExpenseClaimResponse(saved, employee);
    }

    public List<ExpenseClaim> getApprovedClaimsForMonth(Long companyId, Long employeeId, int month, int year) {
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        return expenseClaimRepository.findAllByCompanyIdAndEmployeeIdAndStatusAndClaimDateBetween(
                companyId, employeeId, ExpenseClaimStatus.APPROVED, startDate, endDate);
    }
}

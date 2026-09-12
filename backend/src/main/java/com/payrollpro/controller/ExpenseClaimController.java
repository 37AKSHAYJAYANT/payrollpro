package com.payrollpro.controller;

import com.payrollpro.dto.ExpenseClaimRequest;
import com.payrollpro.dto.ExpenseClaimResponse;
import com.payrollpro.service.ExpenseClaimService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseClaimController {

    private final ExpenseClaimService expenseClaimService;

    public ExpenseClaimController(ExpenseClaimService expenseClaimService) {
        this.expenseClaimService = expenseClaimService;
    }

    @PostMapping({"", "/submit"})
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ExpenseClaimResponse> submitClaim(@RequestBody ExpenseClaimRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseClaimService.submitClaim(request));
    }

    @GetMapping({"/my", "/my-claims"})
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ExpenseClaimResponse>> getMyClaims() {
        return ResponseEntity.ok(expenseClaimService.getMyClaims());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ExpenseClaimResponse>> getPendingClaims() {
        return ResponseEntity.ok(expenseClaimService.getPendingClaims());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ExpenseClaimResponse>> getAllClaims() {
        return ResponseEntity.ok(expenseClaimService.getAllClaims());
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<ExpenseClaimResponse>> getClaimsForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(expenseClaimService.getClaimsForEmployee(employeeId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ExpenseClaimResponse> getClaimById(@PathVariable Long id) {
        return ResponseEntity.ok(expenseClaimService.getClaimById(id));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ExpenseClaimResponse> approveClaim(
            @PathVariable Long id,
            @RequestBody(required = false) ExpenseClaimRequest request) {
        String remarks = (request != null) ? request.getRemarks() : null;
        return ResponseEntity.ok(expenseClaimService.approveClaim(id, remarks));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ExpenseClaimResponse> rejectClaim(
            @PathVariable Long id,
            @RequestBody(required = false) ExpenseClaimRequest request) {
        String remarks = (request != null) ? request.getRemarks() : null;
        return ResponseEntity.ok(expenseClaimService.rejectClaim(id, remarks));
    }
}

package com.payrollpro.controller;

import com.payrollpro.dto.TaxDeclarationRequest;
import com.payrollpro.dto.TaxDeclarationResponse;
import com.payrollpro.model.TaxDeclarationStatus;
import com.payrollpro.model.User;
import com.payrollpro.repository.UserRepository;
import com.payrollpro.service.TaxDeclarationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tax")
public class TaxDeclarationController {

    private final TaxDeclarationService taxDeclarationService;
    private final UserRepository userRepository;

    public TaxDeclarationController(TaxDeclarationService taxDeclarationService,
                                    UserRepository userRepository) {
        this.taxDeclarationService = taxDeclarationService;
        this.userRepository = userRepository;
    }

    private Long getCurrentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getEmployeeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not linked to an employee record");
        }
        return user.getEmployeeId();
    }

    @PostMapping("/declaration")
    public ResponseEntity<TaxDeclarationResponse> submitMyDeclaration(@RequestBody TaxDeclarationRequest req) {
        Long employeeId = getCurrentEmployeeId();
        TaxDeclarationResponse response = taxDeclarationService.saveOrUpdateDeclaration(employeeId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/declaration/my")
    public ResponseEntity<TaxDeclarationResponse> getMyDeclaration(
            @RequestParam(required = false, defaultValue = "2026-2027") String financialYear) {
        Long employeeId = getCurrentEmployeeId();
        return ResponseEntity.ok(taxDeclarationService.getDeclaration(employeeId, financialYear));
    }

    @GetMapping("/declaration/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaxDeclarationResponse> getEmployeeDeclaration(
            @PathVariable Long employeeId,
            @RequestParam(required = false, defaultValue = "2026-2027") String financialYear) {
        return ResponseEntity.ok(taxDeclarationService.getDeclaration(employeeId, financialYear));
    }

    @GetMapping("/declarations/pending")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaxDeclarationResponse>> getPendingDeclarations() {
        return ResponseEntity.ok(taxDeclarationService.getAllPendingDeclarations());
    }

    @PutMapping("/declarations/{id}/verify")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TaxDeclarationResponse> verifyDeclaration(
            @PathVariable Long id,
            @RequestParam(defaultValue = "VERIFIED") TaxDeclarationStatus status,
            @RequestParam(required = false, defaultValue = "") String remarks) {
        return ResponseEntity.ok(taxDeclarationService.verifyDeclaration(id, status, remarks));
    }
}

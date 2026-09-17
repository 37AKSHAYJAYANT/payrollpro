package com.payrollpro.controller;

import com.payrollpro.dto.SalaryStructureRequest;
import com.payrollpro.dto.SalaryStructureResponse;
import com.payrollpro.service.SalaryStructureService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
public class SalaryStructureController {

    private final SalaryStructureService salaryStructureService;

    public SalaryStructureController(SalaryStructureService salaryStructureService) {
        this.salaryStructureService = salaryStructureService;
    }

    @GetMapping("/api/employees/{id}/salary")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaryStructureResponse> getSalaryStructure(@PathVariable Long id) {
        return ResponseEntity.ok(salaryStructureService.getSalaryStructure(id));
    }

    @PostMapping("/api/employees/{id}/salary")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaryStructureResponse> createOrUpdateSalaryStructure(
            @PathVariable Long id,
            @Valid @RequestBody SalaryStructureRequest request) {
        return ResponseEntity.ok(salaryStructureService.createOrUpdateSalaryStructure(id, request));
    }

    @GetMapping("/api/salary-structures/preview")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<SalaryStructureResponse> preview(@RequestParam BigDecimal annualCTC) {
        return ResponseEntity.ok(salaryStructureService.previewSalaryStructure(annualCTC));
    }
}

package com.payrollpro.controller;

import com.payrollpro.dto.SalaryStructureRequest;
import com.payrollpro.dto.SalaryStructureResponse;
import com.payrollpro.service.SalaryStructureService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees/{id}/salary")
public class SalaryStructureController {

    private final SalaryStructureService salaryStructureService;

    public SalaryStructureController(SalaryStructureService salaryStructureService) {
        this.salaryStructureService = salaryStructureService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaryStructureResponse> getSalaryStructure(@PathVariable Long id) {
        return ResponseEntity.ok(salaryStructureService.getSalaryStructure(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SalaryStructureResponse> createOrUpdateSalaryStructure(
            @PathVariable Long id,
            @Valid @RequestBody SalaryStructureRequest request) {
        return ResponseEntity.ok(salaryStructureService.createOrUpdateSalaryStructure(id, request));
    }
}

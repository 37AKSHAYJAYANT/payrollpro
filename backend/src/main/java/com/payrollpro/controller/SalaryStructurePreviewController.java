package com.payrollpro.controller;

import com.payrollpro.dto.SalaryStructureResponse;
import com.payrollpro.service.SalaryStructureService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/salary-structures")
public class SalaryStructurePreviewController {

    private final SalaryStructureService salaryStructureService;

    public SalaryStructurePreviewController(SalaryStructureService salaryStructureService) {
        this.salaryStructureService = salaryStructureService;
    }

    @GetMapping("/preview")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<SalaryStructureResponse> preview(@RequestParam BigDecimal annualCTC) {
        return ResponseEntity.ok(salaryStructureService.previewSalaryStructure(annualCTC));
    }
}

package com.payrollpro.controller;

import com.payrollpro.dto.PayrollRecordResponse;
import com.payrollpro.dto.PayrollRunResponse;
import com.payrollpro.service.PayrollService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PayrollRunResponse> executePayrollRun(
            @RequestParam int month,
            @RequestParam int year) {
        PayrollRunResponse run = payrollService.executePayrollRun(month, year);
        return ResponseEntity.status(HttpStatus.CREATED).body(run);
    }

    @GetMapping("/runs")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<PayrollRunResponse>> getAllPayrollRuns() {
        return ResponseEntity.ok(payrollService.getAllPayrollRuns());
    }

    @GetMapping("/runs/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<PayrollRunResponse> getPayrollRunById(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.getPayrollRunById(id));
    }

    @GetMapping("/runs/{id}/records")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<PayrollRecordResponse>> getPayrollRecordsForRun(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.getPayrollRecordsForRun(id));
    }

    @PutMapping("/runs/{id}/review")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PayrollRunResponse> reviewPayrollRun(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.reviewPayrollRun(id));
    }

    @PutMapping("/runs/{id}/approve")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PayrollRunResponse> approvePayrollRun(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.approvePayrollRun(id));
    }

    @PutMapping("/runs/{id}/lock")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PayrollRunResponse> lockPayrollRun(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.lockPayrollRun(id));
    }
}

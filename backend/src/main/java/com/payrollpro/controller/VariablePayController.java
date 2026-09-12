package com.payrollpro.controller;

import com.payrollpro.dto.VariablePayRequest;
import com.payrollpro.dto.VariablePayResponse;
import com.payrollpro.dto.VariablePayUploadSummary;
import com.payrollpro.service.VariablePayService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/payroll/variable-pay")
public class VariablePayController {

    private final VariablePayService variablePayService;

    public VariablePayController(VariablePayService variablePayService) {
        this.variablePayService = variablePayService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<VariablePayResponse> addManualEntry(@Valid @RequestBody VariablePayRequest request) {
        VariablePayResponse response = variablePayService.addManualEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<VariablePayResponse>> getVariablePayForMonth(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(variablePayService.getForMonthAndYear(month, year));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<VariablePayResponse>> getForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(variablePayService.getForEmployee(employeeId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<VariablePayResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(variablePayService.getById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        variablePayService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping({"/upload-csv", "/bulk-upload"})
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<VariablePayUploadSummary> uploadCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "1") int month,
            @RequestParam(required = false, defaultValue = "2026") int year) {
        VariablePayUploadSummary summary = variablePayService.uploadCsv(file, month, year);
        return ResponseEntity.ok(summary);
    }
}

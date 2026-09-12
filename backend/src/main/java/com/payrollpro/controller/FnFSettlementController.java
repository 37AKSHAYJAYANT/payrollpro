package com.payrollpro.controller;

import com.payrollpro.dto.FnFSettlementCalculationRequest;
import com.payrollpro.dto.FnFSettlementResponse;
import com.payrollpro.service.FnFSettlementService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
@RequestMapping("/api/settlements")
public class FnFSettlementController {

    private final FnFSettlementService fnfSettlementService;

    public FnFSettlementController(FnFSettlementService fnfSettlementService) {
        this.fnfSettlementService = fnfSettlementService;
    }

    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<FnFSettlementResponse> calculatePreview(@RequestBody FnFSettlementCalculationRequest request) {
        return ResponseEntity.ok(fnfSettlementService.calculatePreview(request));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<FnFSettlementResponse> saveSettlement(@RequestBody FnFSettlementCalculationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fnfSettlementService.saveSettlement(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<FnFSettlementResponse>> getAllSettlements() {
        return ResponseEntity.ok(fnfSettlementService.getAllSettlements());
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<FnFSettlementResponse> getSettlementByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(fnfSettlementService.getSettlementByEmployeeId(employeeId));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<FnFSettlementResponse> approveSettlement(@PathVariable Long id) {
        return ResponseEntity.ok(fnfSettlementService.approveSettlement(id));
    }

    @GetMapping("/{id}/statement-pdf")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<byte[]> downloadSettlementPdf(@PathVariable Long id) {
        byte[] pdfBytes = fnfSettlementService.generateSettlementPdf(id);
        String filename = "FnF_Settlement_Statement_" + id + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}

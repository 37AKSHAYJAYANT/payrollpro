package com.payrollpro.controller;

import com.payrollpro.dto.StatutorySummaryResponse;
import com.payrollpro.service.StatutoryComplianceService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/statutory")
public class StatutoryController {

    private final StatutoryComplianceService statutoryComplianceService;

    public StatutoryController(StatutoryComplianceService statutoryComplianceService) {
        this.statutoryComplianceService = statutoryComplianceService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<StatutorySummaryResponse> getStatutorySummary(@RequestParam Long payrollRunId) {
        return ResponseEntity.ok(statutoryComplianceService.getStatutorySummary(payrollRunId));
    }

    @GetMapping("/epfo-ecr")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadEpfoEcrText(@RequestParam Long payrollRunId) {
        byte[] content = statutoryComplianceService.generateEpfoEcrText(payrollRunId);
        String filename = "EPFO_ECR_Run_" + payrollRunId + ".txt";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(content);
    }

    @GetMapping("/esic-return")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadEsicReturnCsv(@RequestParam Long payrollRunId) {
        byte[] content = statutoryComplianceService.generateEsicReturnCsv(payrollRunId);
        String filename = "ESIC_Return_Run_" + payrollRunId + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(content);
    }
}

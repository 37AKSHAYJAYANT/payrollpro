package com.payrollpro.controller;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.PayrollRecordResponse;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.service.EmailDispatchService;
import com.payrollpro.service.PayslipService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payslips")
public class PayslipController {

    private final PayslipService payslipService;
    private final EmailDispatchService emailDispatchService;
    private final PayrollRecordRepository payrollRecordRepository;

    public PayslipController(PayslipService payslipService,
                             EmailDispatchService emailDispatchService,
                             PayrollRecordRepository payrollRecordRepository) {
        this.payslipService = payslipService;
        this.emailDispatchService = emailDispatchService;
        this.payrollRecordRepository = payrollRecordRepository;
    }

    @GetMapping("/{recordId}/pdf")
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable Long recordId) {
        byte[] pdfBytes = payslipService.generatePayslipPdf(recordId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "payslip-" + recordId + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<PayrollRecordResponse>> getMyPayslips() {
        return ResponseEntity.ok(payslipService.getMyPayslips());
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<PayrollRecordResponse>> getPayslipsForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(payslipService.getPayslipsForEmployee(employeeId));
    }

    @PostMapping("/{recordId}/send-email")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendPayslipEmail(@PathVariable Long recordId) {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        payrollRecordRepository.findByCompanyIdAndId(companyId, recordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll record not found"));

        emailDispatchService.sendPayslipEmail(companyId, recordId);

        return ResponseEntity.ok(Map.of(
                "message", "Payslip email dispatch initiated successfully",
                "payrollRecordId", recordId,
                "status", "QUEUED"
        ));
    }
}

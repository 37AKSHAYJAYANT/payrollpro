package com.payrollpro.controller;

import com.payrollpro.dto.PayrollRecordResponse;
import com.payrollpro.service.PayslipService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payslips")
public class PayslipController {

    private final PayslipService payslipService;

    public PayslipController(PayslipService payslipService) {
        this.payslipService = payslipService;
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
}

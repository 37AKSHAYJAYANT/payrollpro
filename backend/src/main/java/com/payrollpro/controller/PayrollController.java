package com.payrollpro.controller;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.PayrollRecordResponse;
import com.payrollpro.dto.PayrollRunResponse;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import com.payrollpro.service.BankDisbursalService;
import com.payrollpro.service.EmailDispatchService;
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
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;
    private final BankDisbursalService bankDisbursalService;
    private final EmailDispatchService emailDispatchService;
    private final PayrollRunRepository payrollRunRepository;
    private final PayrollRecordRepository payrollRecordRepository;

    public PayrollController(PayrollService payrollService,
                             BankDisbursalService bankDisbursalService,
                             EmailDispatchService emailDispatchService,
                             PayrollRunRepository payrollRunRepository,
                             PayrollRecordRepository payrollRecordRepository) {
        this.payrollService = payrollService;
        this.bankDisbursalService = bankDisbursalService;
        this.emailDispatchService = emailDispatchService;
        this.payrollRunRepository = payrollRunRepository;
        this.payrollRecordRepository = payrollRecordRepository;
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

    @GetMapping("/runs/{id}/bank-validation")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<com.payrollpro.dto.BankValidationSummary> validateBankDisbursal(@PathVariable Long id) {
        return ResponseEntity.ok(bankDisbursalService.validatePayrollRunBankDetails(id));
    }

    @GetMapping("/runs/{id}/bank-export")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportBankDisbursal(
            @PathVariable Long id,
            @RequestParam(defaultValue = "GENERIC_NEFT") com.payrollpro.model.BankDisbursalFormat format) {
        byte[] fileBytes = bankDisbursalService.generateDisbursalFile(id, format);
        String extension = (format == com.payrollpro.model.BankDisbursalFormat.HDFC_CMS) ? "txt" : "csv";
        String filename = "bank_disbursal_run_" + id + "_" + format.name().toLowerCase() + "." + extension;

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(fileBytes);
    }

    @PostMapping("/runs/{id}/send-payslips")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendBatchPayslips(@PathVariable Long id) {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        payrollRunRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));

        emailDispatchService.sendBatchPayslips(companyId, id);

        return ResponseEntity.ok(Map.of(
                "message", "Batch payslip email distribution initiated successfully",
                "payrollRunId", id,
                "status", "QUEUED"
        ));
    }

    @PostMapping("/records/{id}/send-email")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendPayslipEmail(@PathVariable Long id) {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        payrollRecordRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll record not found"));

        emailDispatchService.sendPayslipEmail(companyId, id);

        return ResponseEntity.ok(Map.of(
                "message", "Payslip email dispatch initiated successfully",
                "payrollRecordId", id,
                "status", "QUEUED"
        ));
    }
}

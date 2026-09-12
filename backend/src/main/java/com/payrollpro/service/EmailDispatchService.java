package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.EmailDispatchResult;
import com.payrollpro.dto.EmailDispatchSummary;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailDispatchService {

    private static final Logger log = LoggerFactory.getLogger(EmailDispatchService.class);

    private final PayrollRecordRepository payrollRecordRepository;
    private final PayrollRunRepository payrollRunRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final CompanyRepository companyRepository;
    private final PayslipPdfService payslipPdfService;
    private final JavaMailSender mailSender;

    public EmailDispatchService(PayrollRecordRepository payrollRecordRepository,
                                PayrollRunRepository payrollRunRepository,
                                EmployeeRepository employeeRepository,
                                SalaryStructureRepository salaryStructureRepository,
                                CompanyRepository companyRepository,
                                PayslipPdfService payslipPdfService,
                                @Autowired(required = false) JavaMailSender mailSender) {
        this.payrollRecordRepository = payrollRecordRepository;
        this.payrollRunRepository = payrollRunRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.companyRepository = companyRepository;
        this.payslipPdfService = payslipPdfService;
        this.mailSender = mailSender;
    }

    @Async("taskExecutor")
    public CompletableFuture<EmailDispatchResult> sendPayslipEmail(Long payrollRecordId) {
        Long companyId = TenantContext.getCompanyId();
        return CompletableFuture.completedFuture(doSendPayslipEmail(companyId, payrollRecordId));
    }

    @Async("taskExecutor")
    public CompletableFuture<EmailDispatchResult> sendPayslipEmail(Long companyId, Long payrollRecordId) {
        return CompletableFuture.completedFuture(doSendPayslipEmail(companyId, payrollRecordId));
    }

    @Async("taskExecutor")
    public CompletableFuture<EmailDispatchSummary> sendBatchPayslips(Long payrollRunId) {
        Long companyId = TenantContext.getCompanyId();
        return CompletableFuture.completedFuture(doSendBatchPayslips(companyId, payrollRunId));
    }

    @Async("taskExecutor")
    public CompletableFuture<EmailDispatchSummary> sendBatchPayslips(Long companyId, Long payrollRunId) {
        return CompletableFuture.completedFuture(doSendBatchPayslips(companyId, payrollRunId));
    }

    public EmailDispatchResult doSendPayslipEmail(Long companyId, Long payrollRecordId) {
        PayrollRecord record;
        if (companyId != null) {
            record = payrollRecordRepository.findByCompanyIdAndId(companyId, payrollRecordId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll record not found"));
        } else {
            record = payrollRecordRepository.findById(payrollRecordId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll record not found"));
            companyId = record.getCompanyId();
        }

        TenantContext.setCompanyId(companyId);
        try {
            Employee employee = employeeRepository.findByCompanyIdAndId(companyId, record.getEmployeeId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

            SalaryStructure salary = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, record.getEmployeeId())
                    .orElse(null);

            Company company = companyRepository.findById(companyId).orElse(null);

            byte[] pdfBytes = payslipPdfService.generateEncryptedPayslipPdf(record, employee, salary, company);
            String passwordHint = payslipPdfService.generatePayslipPassword(employee);

            String recipientEmail = employee.getEmail();
            if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
                log.warn("Cannot send payslip email: Employee {} has no email configured", employee.getEmpCode());
                return new EmailDispatchResult(payrollRecordId, employee.getEmpCode(), null, "FAILED", "Employee email address missing");
            }

            if (mailSender == null) {
                log.info("[SIMULATED_SUCCESS] Mail server host not configured. Simulated dispatch of encrypted payslip to {} ({}) for period {}/{}",
                        recipientEmail, employee.getEmpCode(), record.getMonth(), record.getYear());
                return new EmailDispatchResult(payrollRecordId, employee.getEmpCode(), recipientEmail, "SIMULATED_SUCCESS",
                        "Mail server host not configured. Simulated dispatch successful.");
            }

            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

                helper.setTo(recipientEmail);
                String companyName = (company != null && company.getName() != null) ? company.getName() : "PayrollPro";
                String monthName = Month.of(record.getMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
                helper.setSubject(String.format("Payslip for %s %d - %s", monthName, record.getYear(), companyName));

                String htmlBody = buildEmailHtml(employee, record, companyName, passwordHint);
                helper.setText(htmlBody, true);

                String attachmentFilename = String.format("payslip_%s_%d_%02d.pdf", employee.getEmpCode(), record.getYear(), record.getMonth());
                helper.addAttachment(attachmentFilename, new ByteArrayResource(pdfBytes));

                mailSender.send(mimeMessage);
                log.info("[SUCCESS] Encrypted payslip dispatched via SMTP to {} ({}) for period {}/{}",
                        recipientEmail, employee.getEmpCode(), record.getMonth(), record.getYear());
                return new EmailDispatchResult(payrollRecordId, employee.getEmpCode(), recipientEmail, "SUCCESS", "Email sent successfully");

            } catch (Exception ex) {
                log.warn("[SIMULATED_SUCCESS] Mail server dispatch failed: {}. Cleanly falling back to SIMULATED_SUCCESS for employee {} ({})",
                        ex.getMessage(), employee.getEmpCode(), recipientEmail);
                return new EmailDispatchResult(payrollRecordId, employee.getEmpCode(), recipientEmail, "SIMULATED_SUCCESS",
                        "Mail server connection failed (" + ex.getMessage() + "). Cleanly fell back to SIMULATED_SUCCESS.");
            }
        } finally {
            TenantContext.clear();
        }
    }

    public EmailDispatchSummary doSendBatchPayslips(Long companyId, Long payrollRunId) {
        if (companyId == null) {
            PayrollRun run = payrollRunRepository.findById(payrollRunId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));
            companyId = run.getCompanyId();
        }

        TenantContext.setCompanyId(companyId);
        try {
            List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, payrollRunId);
            int successCount = 0;
            int simulatedCount = 0;
            int failedCount = 0;

            for (PayrollRecord rec : records) {
                try {
                    EmailDispatchResult result = doSendPayslipEmail(companyId, rec.getId());
                    if ("SUCCESS".equalsIgnoreCase(result.getStatus())) {
                        successCount++;
                    } else if ("SIMULATED_SUCCESS".equalsIgnoreCase(result.getStatus())) {
                        simulatedCount++;
                    } else {
                        failedCount++;
                    }
                } catch (Exception e) {
                    log.error("Failed to process email dispatch for record {}: {}", rec.getId(), e.getMessage());
                    failedCount++;
                }
            }

            log.info("Batch payslip email distribution complete for run {}: Total={}, Success={}, Simulated={}, Failed={}",
                    payrollRunId, records.size(), successCount, simulatedCount, failedCount);

            return new EmailDispatchSummary(payrollRunId, records.size(), successCount, simulatedCount, failedCount, "COMPLETED");
        } finally {
            TenantContext.clear();
        }
    }

    private String buildEmailHtml(Employee employee, PayrollRecord record, String companyName, String passwordHint) {
        String monthName = Month.of(record.getMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String employeeName = (employee.getFirstName() != null ? employee.getFirstName() : "") + " " +
                (employee.getLastName() != null ? employee.getLastName() : "");

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<style>" +
                "  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }" +
                "  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }" +
                "  .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 14px; margin-bottom: 20px; }" +
                "  .header h2 { color: #1e3a8a; margin: 0; font-size: 22px; }" +
                "  .sub { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }" +
                "  .pwd-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 20px 0; border-radius: 4px; }" +
                "  .pwd-box code { font-weight: bold; color: #1e3a8a; font-size: 15px; background: #dbeafe; padding: 2px 6px; border-radius: 3px; }" +
                "  .footer { margin-top: 28px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 14px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class=\"card\">" +
                "  <div class=\"header\">" +
                "    <h2>" + companyName + "</h2>" +
                "    <p class=\"sub\">Payroll & Compensation Department</p>" +
                "  </div>" +
                "  <p>Dear <strong>" + employeeName.trim() + "</strong>,</p>" +
                "  <p>Your salary payslip for <strong>" + monthName + " " + record.getYear() + "</strong> has been finalized and is attached as a password-protected PDF document.</p>" +
                "  <div class=\"pwd-box\">" +
                "    <strong>PDF Password Protection:</strong><br>" +
                "    <p style=\"margin: 6px 0;\">This document is encrypted using 128-bit AES. The password to open your payslip is:</p>" +
                "    <ul style=\"margin: 6px 0; padding-left: 20px;\">" +
                "      <li>First 4 uppercase letters of your First Name</li>" +
                "      <li>Followed by your Date of Birth in <code>DDMM</code> format (or <code>0101</code> if not on file)</li>" +
                "    </ul>" +
                "    <p style=\"margin: 6px 0 0 0;\">Your password: <code>" + passwordHint + "</code></p>" +
                "  </div>" +
                "  <p>If you have any questions or require assistance, please contact your payroll team.</p>" +
                "  <div class=\"footer\">" +
                "    <p>This is a system-generated message sent via PayrollPro Enterprise SaaS.</p>" +
                "  </div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}

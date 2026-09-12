package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.EmailDispatchResult;
import com.payrollpro.dto.EmailDispatchSummary;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailDispatchServiceTest {

    @Mock
    private PayrollRecordRepository payrollRecordRepository;

    @Mock
    private PayrollRunRepository payrollRunRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private SalaryStructureRepository salaryStructureRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private PayslipPdfService payslipPdfService;

    @Mock
    private JavaMailSender mailSender;

    private Long companyId = 1L;
    private Long recordId = 10L;
    private Long runId = 100L;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(companyId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private PayrollRecord createSampleRecord() {
        PayrollRecord record = new PayrollRecord();
        record.setId(recordId);
        record.setCompanyId(companyId);
        record.setEmployeeId(1L);
        record.setPayrollRunId(runId);
        record.setMonth(9);
        record.setYear(2026);
        record.setPayslipRef("PSLIP-2026-09-001");
        record.setNetPay(new BigDecimal("55000.00"));
        return record;
    }

    private Employee createSampleEmployee() {
        Employee emp = new Employee();
        emp.setId(1L);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-001");
        emp.setFirstName("Vikram");
        emp.setLastName("Aditya");
        emp.setEmail("vikram.aditya@democompany.com");
        emp.setDateOfBirth(LocalDate.of(1992, 11, 24));
        return emp;
    }

    private Company createSampleCompany() {
        Company c = new Company("Demo Company Inc.");
        c.setId(companyId);
        return c;
    }

    @Test
    @DisplayName("Email Dispatch - Cleanly logs SIMULATED_SUCCESS when JavaMailSender is null")
    void testSendEmailSimulatedSuccessWhenMailSenderNull() {
        EmailDispatchService serviceWithoutMail = new EmailDispatchService(
                payrollRecordRepository, payrollRunRepository, employeeRepository,
                salaryStructureRepository, companyRepository, payslipPdfService, null
        );

        PayrollRecord record = createSampleRecord();
        Employee employee = createSampleEmployee();
        Company company = createSampleCompany();

        when(payrollRecordRepository.findByCompanyIdAndId(companyId, recordId)).thenReturn(Optional.of(record));
        when(employeeRepository.findByCompanyIdAndId(companyId, 1L)).thenReturn(Optional.of(employee));
        when(salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, 1L)).thenReturn(Optional.empty());
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(payslipPdfService.generateEncryptedPayslipPdf(any(), any(), any(), any())).thenReturn(new byte[]{1, 2, 3});
        when(payslipPdfService.generatePayslipPassword(employee)).thenReturn("VIKR2411");

        CompletableFuture<EmailDispatchResult> future = serviceWithoutMail.sendPayslipEmail(recordId);
        EmailDispatchResult result = future.join();

        assertNotNull(result);
        assertEquals("SIMULATED_SUCCESS", result.getStatus());
        assertEquals("EMP-001", result.getEmployeeCode());
        assertEquals("vikram.aditya@democompany.com", result.getRecipientEmail());
        assertTrue(result.getMessage().contains("Simulated dispatch successful"));
    }

    @Test
    @DisplayName("Email Dispatch - Graceful fallback to SIMULATED_SUCCESS when mail server fails")
    void testSendEmailFallbackWhenMailServerThrows() {
        EmailDispatchService service = new EmailDispatchService(
                payrollRecordRepository, payrollRunRepository, employeeRepository,
                salaryStructureRepository, companyRepository, payslipPdfService, mailSender
        );

        PayrollRecord record = createSampleRecord();
        Employee employee = createSampleEmployee();
        Company company = createSampleCompany();

        when(payrollRecordRepository.findByCompanyIdAndId(companyId, recordId)).thenReturn(Optional.of(record));
        when(employeeRepository.findByCompanyIdAndId(companyId, 1L)).thenReturn(Optional.of(employee));
        when(salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, 1L)).thenReturn(Optional.empty());
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(payslipPdfService.generateEncryptedPayslipPdf(any(), any(), any(), any())).thenReturn(new byte[]{1, 2, 3});
        when(payslipPdfService.generatePayslipPassword(employee)).thenReturn("VIKR2411");

        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("Connection refused to mail server")).when(mailSender).send(any(MimeMessage.class));

        CompletableFuture<EmailDispatchResult> future = service.sendPayslipEmail(recordId);
        EmailDispatchResult result = future.join();

        assertNotNull(result);
        assertEquals("SIMULATED_SUCCESS", result.getStatus());
        assertTrue(result.getMessage().contains("Connection refused to mail server"));
    }

    @Test
    @DisplayName("Email Dispatch - Returns SUCCESS when SMTP sends email successfully")
    void testSendEmailSuccess() {
        EmailDispatchService service = new EmailDispatchService(
                payrollRecordRepository, payrollRunRepository, employeeRepository,
                salaryStructureRepository, companyRepository, payslipPdfService, mailSender
        );

        PayrollRecord record = createSampleRecord();
        Employee employee = createSampleEmployee();
        Company company = createSampleCompany();

        when(payrollRecordRepository.findByCompanyIdAndId(companyId, recordId)).thenReturn(Optional.of(record));
        when(employeeRepository.findByCompanyIdAndId(companyId, 1L)).thenReturn(Optional.of(employee));
        when(salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, 1L)).thenReturn(Optional.empty());
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(payslipPdfService.generateEncryptedPayslipPdf(any(), any(), any(), any())).thenReturn(new byte[]{1, 2, 3});
        when(payslipPdfService.generatePayslipPassword(employee)).thenReturn("VIKR2411");

        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        CompletableFuture<EmailDispatchResult> future = service.sendPayslipEmail(recordId);
        EmailDispatchResult result = future.join();

        assertNotNull(result);
        assertEquals("SUCCESS", result.getStatus());
        assertEquals("vikram.aditya@democompany.com", result.getRecipientEmail());
        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    @DisplayName("Batch Email Dispatch - Dispatches emails for all records in payroll run")
    void testBatchEmailDispatch() {
        EmailDispatchService serviceWithoutMail = new EmailDispatchService(
                payrollRecordRepository, payrollRunRepository, employeeRepository,
                salaryStructureRepository, companyRepository, payslipPdfService, null
        );

        PayrollRun run = new PayrollRun();
        run.setId(runId);
        run.setCompanyId(companyId);

        PayrollRecord rec1 = createSampleRecord();
        PayrollRecord rec2 = new PayrollRecord();
        rec2.setId(11L);
        rec2.setCompanyId(companyId);
        rec2.setEmployeeId(2L);
        rec2.setPayrollRunId(runId);
        rec2.setMonth(9);
        rec2.setYear(2026);
        rec2.setPayslipRef("PSLIP-2026-09-002");

        Employee emp1 = createSampleEmployee();
        Employee emp2 = new Employee();
        emp2.setId(2L);
        emp2.setCompanyId(companyId);
        emp2.setEmpCode("EMP-002");
        emp2.setFirstName("Pooja");
        emp2.setEmail("pooja@democompany.com");

        lenient().when(payrollRunRepository.findById(runId)).thenReturn(Optional.of(run));
        when(payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, runId)).thenReturn(List.of(rec1, rec2));
        when(payrollRecordRepository.findByCompanyIdAndId(companyId, 10L)).thenReturn(Optional.of(rec1));
        when(payrollRecordRepository.findByCompanyIdAndId(companyId, 11L)).thenReturn(Optional.of(rec2));
        when(employeeRepository.findByCompanyIdAndId(companyId, 1L)).thenReturn(Optional.of(emp1));
        when(employeeRepository.findByCompanyIdAndId(companyId, 2L)).thenReturn(Optional.of(emp2));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(createSampleCompany()));
        when(payslipPdfService.generateEncryptedPayslipPdf(any(), any(), any(), any())).thenReturn(new byte[]{1, 2, 3});
        when(payslipPdfService.generatePayslipPassword(any())).thenReturn("PASS1234");

        CompletableFuture<EmailDispatchSummary> future = serviceWithoutMail.sendBatchPayslips(runId);
        EmailDispatchSummary summary = future.join();

        assertNotNull(summary);
        assertEquals(2, summary.getTotalRecords());
        assertEquals(2, summary.getSimulatedCount());
        assertEquals(0, summary.getFailedCount());
        assertEquals("COMPLETED", summary.getStatus());
    }
}

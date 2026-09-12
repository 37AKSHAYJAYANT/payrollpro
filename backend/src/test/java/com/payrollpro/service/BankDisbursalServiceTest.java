package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.BankValidationSummary;
import com.payrollpro.model.BankDisbursalFormat;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.model.PayrollRunStatus;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BankDisbursalServiceTest {

    @Mock
    private PayrollRunRepository payrollRunRepository;

    @Mock
    private PayrollRecordRepository payrollRecordRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private BankDisbursalService bankDisbursalService;

    private Long companyId = 1L;
    private Long runId = 100L;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(companyId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Validate Bank Details - Identifies Valid and Invalid Bank Details")
    void testValidateBankDetails() {
        PayrollRun run = new PayrollRun();
        run.setId(runId);
        run.setCompanyId(companyId);

        // Employee 1: Valid
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setCompanyId(companyId);
        emp1.setEmpCode("EMP-001");
        emp1.setFirstName("Aarav");
        emp1.setLastName("Sharma");
        emp1.setBankAccountNumber("123456789012");
        emp1.setIfscCode("HDFC0001234");

        // Employee 2: Invalid IFSC
        Employee emp2 = new Employee();
        emp2.setId(2L);
        emp2.setCompanyId(companyId);
        emp2.setEmpCode("EMP-002");
        emp2.setFirstName("Pooja");
        emp2.setLastName("Verma");
        emp2.setBankAccountNumber("987654321000");
        emp2.setIfscCode("INVALID_IFSC");

        PayrollRecord rec1 = new PayrollRecord();
        rec1.setId(10L);
        rec1.setCompanyId(companyId);
        rec1.setEmployeeId(1L);
        rec1.setPayrollRunId(runId);
        rec1.setNetPay(new BigDecimal("50000.00"));

        PayrollRecord rec2 = new PayrollRecord();
        rec2.setId(11L);
        rec2.setCompanyId(companyId);
        rec2.setEmployeeId(2L);
        rec2.setPayrollRunId(runId);
        rec2.setNetPay(new BigDecimal("45000.00"));

        when(payrollRunRepository.findByCompanyIdAndId(companyId, runId)).thenReturn(Optional.of(run));
        when(payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, runId)).thenReturn(List.of(rec1, rec2));
        when(employeeRepository.findAllByCompanyId(companyId)).thenReturn(List.of(emp1, emp2));

        BankValidationSummary summary = bankDisbursalService.validatePayrollRunBankDetails(runId);

        assertNotNull(summary);
        assertEquals(2, summary.getTotalRecords());
        assertEquals(1, summary.getValidRecords());
        assertEquals(1, summary.getInvalidRecords());
        assertEquals(new BigDecimal("50000.00"), summary.getTotalPayout());
        assertEquals(1, summary.getErrors().size());
        assertEquals("EMP-002", summary.getErrors().get(0).getEmpCode());
    }

    @Test
    @DisplayName("Generate Disbursal File - Fails if Payroll Run is in DRAFT Status")
    void testDisbursalFailsForDraftRun() {
        PayrollRun run = new PayrollRun();
        run.setId(runId);
        run.setCompanyId(companyId);
        run.setStatus(PayrollRunStatus.DRAFT);

        when(payrollRunRepository.findByCompanyIdAndId(companyId, runId)).thenReturn(Optional.of(run));

        assertThrows(ResponseStatusException.class, () ->
                bankDisbursalService.generateDisbursalFile(runId, BankDisbursalFormat.GENERIC_NEFT));
    }

    @Test
    @DisplayName("Generate Disbursal File - Generic NEFT CSV Format")
    void testGenerateGenericNeftDisbursal() {
        PayrollRun run = new PayrollRun();
        run.setId(runId);
        run.setCompanyId(companyId);
        run.setMonth(9);
        run.setYear(2026);
        run.setStatus(PayrollRunStatus.APPROVED);

        Company comp = new Company("Acme Tech Solutions");
        comp.setId(companyId);

        Employee emp = new Employee();
        emp.setId(1L);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-001");
        emp.setFirstName("Rohan");
        emp.setLastName("Mehta");
        emp.setBankAccountNumber("123456789012");
        emp.setIfscCode("ICIC0001234");

        PayrollRecord rec = new PayrollRecord();
        rec.setId(10L);
        rec.setCompanyId(companyId);
        rec.setEmployeeId(1L);
        rec.setPayrollRunId(runId);
        rec.setPayslipRef("PSLIP-2026-09-001");
        rec.setNetPay(new BigDecimal("75000.00"));

        when(payrollRunRepository.findByCompanyIdAndId(companyId, runId)).thenReturn(Optional.of(run));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(comp));
        when(payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, runId)).thenReturn(List.of(rec));
        when(employeeRepository.findAllByCompanyId(companyId)).thenReturn(List.of(emp));

        byte[] result = bankDisbursalService.generateDisbursalFile(runId, BankDisbursalFormat.GENERIC_NEFT);
        String csv = new String(result, StandardCharsets.UTF_8);

        assertTrue(csv.contains("Beneficiary Account Number,Beneficiary Name,IFSC Code,Amount,Payment Reference,Remarks"));
        assertTrue(csv.contains("123456789012"));
        assertTrue(csv.contains("Rohan Mehta"));
        assertTrue(csv.contains("ICIC0001234"));
        assertTrue(csv.contains("75000.00"));
    }

    @Test
    @DisplayName("Generate Disbursal File - HDFC CMS Pipe Format")
    void testGenerateHdfcCmsDisbursal() {
        PayrollRun run = new PayrollRun();
        run.setId(runId);
        run.setCompanyId(companyId);
        run.setMonth(9);
        run.setYear(2026);
        run.setStatus(PayrollRunStatus.LOCKED);

        Company comp = new Company("Acme Tech Solutions");
        comp.setId(companyId);

        Employee emp = new Employee();
        emp.setId(1L);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-001");
        emp.setFirstName("Rohan");
        emp.setLastName("Mehta");
        emp.setEmail("rohan@example.com");
        emp.setBankAccountNumber("50100012345678");
        emp.setIfscCode("HDFC0000001");

        PayrollRecord rec = new PayrollRecord();
        rec.setId(10L);
        rec.setCompanyId(companyId);
        rec.setEmployeeId(1L);
        rec.setPayrollRunId(runId);
        rec.setNetPay(new BigDecimal("92000.00"));

        when(payrollRunRepository.findByCompanyIdAndId(companyId, runId)).thenReturn(Optional.of(run));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(comp));
        when(payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, runId)).thenReturn(List.of(rec));
        when(employeeRepository.findAllByCompanyId(companyId)).thenReturn(List.of(emp));

        byte[] result = bankDisbursalService.generateDisbursalFile(runId, BankDisbursalFormat.HDFC_CMS);
        String content = new String(result, StandardCharsets.UTF_8);

        assertTrue(content.contains("Record Type|Beneficiary Code|Beneficiary Account|Amount|Beneficiary Name|IFSC|Debit Account|Value Date|Email"));
        assertTrue(content.contains("P|EMP-001|50100012345678|92000.00|Rohan Mehta|HDFC0000001|"));
        assertTrue(content.contains("rohan@example.com"));
    }
}

package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.StatutorySummaryResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.model.PayrollRunStatus;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatutoryComplianceServiceTest {

    @Mock
    private PayrollRunRepository payrollRunRepository;

    @Mock
    private PayrollRecordRepository payrollRecordRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private StatutoryComplianceService statutoryService;

    private PayrollRun mockRun;
    private PayrollRecord mockRecord1;
    private PayrollRecord mockRecord2;
    private Employee emp1;
    private Employee emp2;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(1L);

        mockRun = new PayrollRun();
        mockRun.setId(10L);
        mockRun.setCompanyId(1L);
        mockRun.setMonth(5);
        mockRun.setYear(2026);
        mockRun.setStatus(PayrollRunStatus.LOCKED);

        emp1 = new Employee();
        emp1.setId(101L);
        emp1.setCompanyId(1L);
        emp1.setEmpCode("EMP-101");
        emp1.setFirstName("Vikram");
        emp1.setLastName("Aditya");
        emp1.setAadhaarNumber("101234567890");

        emp2 = new Employee();
        emp2.setId(102L);
        emp2.setCompanyId(1L);
        emp2.setEmpCode("EMP-102");
        emp2.setFirstName("Ravi");
        emp2.setLastName("Kumar");

        // High earner (Gross 50,000, Basic 25,000 > 15,000 EPF ceiling)
        mockRecord1 = new PayrollRecord();
        mockRecord1.setId(1L);
        mockRecord1.setCompanyId(1L);
        mockRecord1.setPayrollRunId(10L);
        mockRecord1.setEmployeeId(101L);
        mockRecord1.setGrossEarned(new BigDecimal("50000.00"));
        mockRecord1.setBasicEarned(new BigDecimal("25000.00"));
        mockRecord1.setEpfDeduction(new BigDecimal("1800.00"));
        mockRecord1.setTotalWorkingDays(30);
        mockRecord1.setPayableDays(new BigDecimal("28.0"));

        // Low earner (Gross 18,000, Basic 9,000 -> eligible for ESIC)
        mockRecord2 = new PayrollRecord();
        mockRecord2.setId(2L);
        mockRecord2.setCompanyId(1L);
        mockRecord2.setPayrollRunId(10L);
        mockRecord2.setEmployeeId(102L);
        mockRecord2.setGrossEarned(new BigDecimal("18000.00"));
        mockRecord2.setBasicEarned(new BigDecimal("9000.00"));
        mockRecord2.setEpfDeduction(new BigDecimal("1080.00"));
        mockRecord2.setTotalWorkingDays(30);
        mockRecord2.setPayableDays(new BigDecimal("30.0"));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testGetStatutorySummary() {
        when(payrollRunRepository.findByCompanyIdAndId(1L, 10L)).thenReturn(Optional.of(mockRun));
        when(payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(1L, 10L)).thenReturn(List.of(mockRecord1, mockRecord2));
        when(employeeRepository.findAllByCompanyId(1L)).thenReturn(List.of(emp1, emp2));

        StatutorySummaryResponse summary = statutoryService.getStatutorySummary(10L);

        assertNotNull(summary);
        assertEquals(2, summary.getTotalEmployees());
        assertEquals(2, summary.getEpfEligibleCount());
        // EPF wages: 15,000 (capped) + 9,000 = 24,000
        assertEquals(new BigDecimal("24000.00"), summary.getTotalEpfWages());
        // ESIC: only record 2 has gross <= 21,000
        assertEquals(1, summary.getEsicEligibleCount());
        assertEquals(new BigDecimal("18000.00"), summary.getTotalEsicWages());
    }

    @Test
    void testGenerateEpfoEcrText() {
        when(payrollRunRepository.findByCompanyIdAndId(1L, 10L)).thenReturn(Optional.of(mockRun));
        when(payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(1L, 10L)).thenReturn(List.of(mockRecord1));
        when(employeeRepository.findAllByCompanyId(1L)).thenReturn(List.of(emp1));

        byte[] ecrBytes = statutoryService.generateEpfoEcrText(10L);
        String ecrContent = new String(ecrBytes, StandardCharsets.UTF_8);

        assertTrue(ecrContent.contains("#~#"), "Should contain EPFO delimiter #~#");
        assertTrue(ecrContent.contains("VIKRAM ADITYA"), "Should contain uppercase member name");
        assertTrue(ecrContent.contains("101234567890"), "Should contain Aadhaar/UAN");
        // NCP days: 30 - 28 = 2
        assertTrue(ecrContent.contains("#~#2#~#0"), "Should compute NCP days accurately");
    }

    @Test
    void testGenerateEsicReturnCsv() {
        when(payrollRunRepository.findByCompanyIdAndId(1L, 10L)).thenReturn(Optional.of(mockRun));
        when(payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(1L, 10L)).thenReturn(List.of(mockRecord1, mockRecord2));
        when(employeeRepository.findAllByCompanyId(1L)).thenReturn(List.of(emp1, emp2));

        byte[] esicBytes = statutoryService.generateEsicReturnCsv(10L);
        String esicContent = new String(esicBytes, StandardCharsets.UTF_8);

        assertTrue(esicContent.startsWith("IP Number,IP Name"), "Should have standard CSV header");
        assertTrue(esicContent.contains("Ravi Kumar"), "Should include ESIC eligible employee");
        assertFalse(esicContent.contains("Vikram Aditya"), "Should exclude employee earning > 21,000");
    }
}

package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.VariablePayRequest;
import com.payrollpro.dto.VariablePayResponse;
import com.payrollpro.dto.VariablePayUploadSummary;
import com.payrollpro.model.Employee;
import com.payrollpro.model.VariablePayRecord;
import com.payrollpro.model.VariablePayType;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.VariablePayRecordRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VariablePayServiceTest {

    @Mock
    private VariablePayRecordRepository variablePayRecordRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private VariablePayService variablePayService;

    private final Long companyId = 1L;
    private final Long employeeId = 10L;
    private Employee sampleEmployee;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(companyId);

        sampleEmployee = new Employee();
        sampleEmployee.setId(employeeId);
        sampleEmployee.setCompanyId(companyId);
        sampleEmployee.setEmpCode("EMP001");
        sampleEmployee.setFirstName("Rahul");
        sampleEmployee.setLastName("Sharma");
        sampleEmployee.setDepartment("Engineering");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Add Manual Entry - Success for OVERTIME")
    void testAddManualEntrySuccess() {
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId))
                .thenReturn(Optional.of(sampleEmployee));
        when(variablePayRecordRepository.save(any(VariablePayRecord.class))).thenAnswer(inv -> {
            VariablePayRecord rec = inv.getArgument(0);
            rec.setId(100L);
            return rec;
        });

        VariablePayRequest request = new VariablePayRequest(
                employeeId, 9, 2026, VariablePayType.OVERTIME, new BigDecimal("4500.00"), "Weekend release"
        );

        VariablePayResponse response = variablePayService.addManualEntry(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(employeeId, response.getEmployeeId());
        assertEquals("Rahul Sharma", response.getEmployeeName());
        assertEquals("EMP001", response.getEmpCode());
        assertEquals(VariablePayType.OVERTIME, response.getType());
        assertEquals(new BigDecimal("4500.00"), response.getAmount());
        assertEquals("Weekend release", response.getRemarks());
        assertEquals(9, response.getMonth());
        assertEquals(2026, response.getYear());
    }

    @Test
    @DisplayName("Add Manual Entry - Throws 404 when employee not found")
    void testAddManualEntryEmployeeNotFound() {
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId))
                .thenReturn(Optional.empty());

        VariablePayRequest request = new VariablePayRequest(
                employeeId, 9, 2026, VariablePayType.BONUS, new BigDecimal("10000.00"), "Festival bonus"
        );

        assertThrows(ResponseStatusException.class, () -> variablePayService.addManualEntry(request));
        verify(variablePayRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("Add Manual Entry - Throws 400 when amount is zero or negative")
    void testAddManualEntryNonPositiveAmount() {
        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId))
                .thenReturn(Optional.of(sampleEmployee));

        VariablePayRequest request = new VariablePayRequest(
                employeeId, 9, 2026, VariablePayType.INCENTIVE, BigDecimal.ZERO, "Zero amount"
        );

        assertThrows(ResponseStatusException.class, () -> variablePayService.addManualEntry(request));
        verify(variablePayRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("Get For Month and Year - Returns populated list")
    void testGetForMonthAndYear() {
        VariablePayRecord record1 = new VariablePayRecord(
                companyId, employeeId, 9, 2026, VariablePayType.BONUS, new BigDecimal("15000.00"), "Annual performance"
        );
        record1.setId(1L);

        when(variablePayRecordRepository.findAllByCompanyIdAndYearAndMonth(companyId, 2026, 9))
                .thenReturn(List.of(record1));
        when(employeeRepository.findAllByCompanyId(companyId))
                .thenReturn(List.of(sampleEmployee));

        List<VariablePayResponse> list = variablePayService.getForMonthAndYear(9, 2026);

        assertEquals(1, list.size());
        assertEquals("Rahul Sharma", list.get(0).getEmployeeName());
        assertEquals(VariablePayType.BONUS, list.get(0).getType());
        assertEquals(new BigDecimal("15000.00"), list.get(0).getAmount());
    }

    @Test
    @DisplayName("Get For Employee - Returns employee records")
    void testGetForEmployee() {
        VariablePayRecord record1 = new VariablePayRecord(
                companyId, employeeId, 9, 2026, VariablePayType.INCENTIVE, new BigDecimal("3000.00"), "Q3 sales"
        );
        record1.setId(2L);

        when(employeeRepository.findByCompanyIdAndId(companyId, employeeId))
                .thenReturn(Optional.of(sampleEmployee));
        when(variablePayRecordRepository.findAllByCompanyIdAndEmployeeId(companyId, employeeId))
                .thenReturn(List.of(record1));

        List<VariablePayResponse> list = variablePayService.getForEmployee(employeeId);

        assertEquals(1, list.size());
        assertEquals(new BigDecimal("3000.00"), list.get(0).getAmount());
        assertEquals(VariablePayType.INCENTIVE, list.get(0).getType());
    }

    @Test
    @DisplayName("Delete Entry - Success when found")
    void testDeleteEntrySuccess() {
        VariablePayRecord record = new VariablePayRecord(
                companyId, employeeId, 9, 2026, VariablePayType.DEDUCTION, new BigDecimal("2000.00"), "Advance recovery"
        );
        record.setId(5L);

        when(variablePayRecordRepository.findByCompanyIdAndId(companyId, 5L))
                .thenReturn(Optional.of(record));

        variablePayService.deleteEntry(5L);

        verify(variablePayRecordRepository, times(1)).delete(record);
    }

    @Test
    @DisplayName("Delete Entry - Throws 404 when not found")
    void testDeleteEntryNotFound() {
        when(variablePayRecordRepository.findByCompanyIdAndId(companyId, 99L))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> variablePayService.deleteEntry(99L));
        verify(variablePayRecordRepository, never()).delete(any());
    }

    @Test
    @DisplayName("CSV Upload - Handles both standard and full row formats")
    void testUploadCsvSuccess() {
        String csv = "empCode,type,amount,remarks\n"
                + "EMP001,OVERTIME,3500.00,Weekend duty\n"
                + "EMP001,9,2026,DEDUCTION,1200.00,Damage deduction\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "variable_pay.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)
        );

        when(employeeRepository.findAllByCompanyId(companyId)).thenReturn(List.of(sampleEmployee));
        when(variablePayRecordRepository.save(any(VariablePayRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        VariablePayUploadSummary summary = variablePayService.uploadCsv(file, 9, 2026);

        assertNotNull(summary);
        assertEquals(2, summary.getProcessed());
        assertEquals(0, summary.getErrors());
        verify(variablePayRecordRepository, times(2)).save(any(VariablePayRecord.class));
    }

    @Test
    @DisplayName("CSV Upload - Captures errors for unknown employees and invalid pay types")
    void testUploadCsvWithErrors() {
        String csv = "empCode,type,amount,remarks\n"
                + "UNKNOWN_EMP,OVERTIME,2000.00,Test\n"
                + "EMP001,INVALID_TYPE,2000.00,Test\n"
                + "EMP001,BONUS,-500.00,Negative amount\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)
        );

        when(employeeRepository.findAllByCompanyId(companyId)).thenReturn(List.of(sampleEmployee));

        VariablePayUploadSummary summary = variablePayService.uploadCsv(file, 9, 2026);

        assertEquals(0, summary.getProcessed());
        assertEquals(3, summary.getErrors());
        assertEquals(3, summary.getErrorDetails().size());
        verify(variablePayRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("CSV Upload - Empty file throws 400 Bad Request")
    void testUploadCsvEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.csv", "text/csv", new byte[0]
        );

        assertThrows(ResponseStatusException.class, () -> variablePayService.uploadCsv(emptyFile, 9, 2026));
    }
}

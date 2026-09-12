package com.payrollpro.service;

import com.payrollpro.model.Attendance;
import com.payrollpro.model.AttendanceSource;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.SalaryStructure;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.*;

class PayrollCalculationServiceTest {

    private PayrollCalculationService calculationService;
    private Employee sampleEmployee;

    @BeforeEach
    void setUp() {
        calculationService = new PayrollCalculationService();

        sampleEmployee = new Employee();
        sampleEmployee.setId(1L);
        sampleEmployee.setCompanyId(1L);
        sampleEmployee.setEmpCode("EMP-001");
        sampleEmployee.setFirstName("Aarav");
        sampleEmployee.setLastName("Sharma");
    }

    @Test
    @DisplayName("Full Attendance (26/26 days) - Full Earnings and Exact Deductions")
    void testFullAttendanceCalculation() {
        // CTC ₹12,00,000: Monthly Gross ₹1,00,000 (Basic ₹50,000, HRA ₹20,000, Special ₹30,000)
        SalaryStructure salary = new SalaryStructure();
        salary.setCompanyId(1L);
        salary.setEmployeeId(1L);
        salary.setBasicSalary(new BigDecimal("50000.00"));
        salary.setHra(new BigDecimal("20000.00"));
        salary.setSpecialAllowance(new BigDecimal("30000.00"));
        salary.setMonthlyGross(new BigDecimal("100000.00"));
        salary.setEpfEmployee(new BigDecimal("1800.00"));
        salary.setProfessionalTax(new BigDecimal("200.00"));
        salary.setMonthlyTds(new BigDecimal("5000.00"));

        Attendance attendance = new Attendance(
                1L, 1L, 9, 2026, 26,
                new BigDecimal("26.0"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("26.0"),
                AttendanceSource.MANUAL
        );

        PayrollRecord record = calculationService.calculateForEmployee(sampleEmployee, salary, attendance, 100L);

        assertNotNull(record);
        assertEquals(new BigDecimal("50000.00"), record.getBasicEarned());
        assertEquals(new BigDecimal("20000.00"), record.getHraEarned());
        assertEquals(new BigDecimal("30000.00"), record.getSpecialAllowanceEarned());
        assertEquals(new BigDecimal("100000.00"), record.getGrossEarned());

        // Deductions: 1800 (EPF) + 200 (PT) + 5000 (TDS) = 7000
        assertEquals(new BigDecimal("1800.00"), record.getEpfDeduction());
        assertEquals(new BigDecimal("200.00"), record.getProfessionalTax());
        assertEquals(new BigDecimal("5000.00"), record.getTdsDeduction());
        assertEquals(new BigDecimal("7000.00"), record.getTotalDeductions());

        // Net Pay: 100000 - 7000 = 93000
        assertEquals(new BigDecimal("93000.00"), record.getNetPay());
        assertEquals("PS-2026-09-EMP001", record.getPayslipRef());
    }

    @Test
    @DisplayName("Partial Attendance (20/26 days) - Prorated Earnings with Full Deductions")
    void testPartialAttendanceCalculation() {
        SalaryStructure salary = new SalaryStructure();
        salary.setCompanyId(1L);
        salary.setEmployeeId(1L);
        salary.setBasicSalary(new BigDecimal("50000.00"));
        salary.setHra(new BigDecimal("20000.00"));
        salary.setSpecialAllowance(new BigDecimal("30000.00"));
        salary.setMonthlyGross(new BigDecimal("100000.00"));
        salary.setEpfEmployee(new BigDecimal("1800.00"));
        salary.setProfessionalTax(new BigDecimal("200.00"));
        salary.setMonthlyTds(new BigDecimal("5000.00"));

        // 20 present out of 26
        Attendance attendance = new Attendance(
                1L, 1L, 9, 2026, 26,
                new BigDecimal("20.0"), BigDecimal.ZERO, new BigDecimal("6.0"), new BigDecimal("20.0"),
                AttendanceSource.MANUAL
        );

        PayrollRecord record = calculationService.calculateForEmployee(sampleEmployee, salary, attendance, 100L);

        // Proration factor = 20/26 = 0.769231
        BigDecimal expectedBasic = new BigDecimal("50000.00").multiply(new BigDecimal("20").divide(new BigDecimal("26"), 6, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal expectedHra = new BigDecimal("20000.00").multiply(new BigDecimal("20").divide(new BigDecimal("26"), 6, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal expectedSpecial = new BigDecimal("30000.00").multiply(new BigDecimal("20").divide(new BigDecimal("26"), 6, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);

        assertEquals(expectedBasic, record.getBasicEarned());
        assertEquals(expectedHra, record.getHraEarned());
        assertEquals(expectedSpecial, record.getSpecialAllowanceEarned());

        // Deductions remain flat
        assertEquals(new BigDecimal("7000.00"), record.getTotalDeductions());
        assertEquals(record.getGrossEarned().subtract(record.getTotalDeductions()), record.getNetPay());
    }

    @Test
    @DisplayName("Zero Attendance (0/26 days) - Prorated Earnings are Zero, Net Pay is Negative")
    void testZeroAttendanceAnomaly() {
        SalaryStructure salary = new SalaryStructure();
        salary.setCompanyId(1L);
        salary.setEmployeeId(1L);
        salary.setBasicSalary(new BigDecimal("50000.00"));
        salary.setHra(new BigDecimal("20000.00"));
        salary.setSpecialAllowance(new BigDecimal("30000.00"));
        salary.setMonthlyGross(new BigDecimal("100000.00"));
        salary.setEpfEmployee(new BigDecimal("1800.00"));
        salary.setProfessionalTax(new BigDecimal("200.00"));
        salary.setMonthlyTds(BigDecimal.ZERO);

        Attendance attendance = new Attendance(
                1L, 1L, 9, 2026, 26,
                BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("26.0"), BigDecimal.ZERO,
                AttendanceSource.MANUAL
        );

        PayrollRecord record = calculationService.calculateForEmployee(sampleEmployee, salary, attendance, 100L);

        assertEquals(new BigDecimal("0.00"), record.getGrossEarned());
        assertEquals(new BigDecimal("2000.00"), record.getTotalDeductions());
        // Net pay is negative: 0 - 2000 = -2000
        assertEquals(new BigDecimal("-2000.00"), record.getNetPay());
        assertTrue(record.getNetPay().compareTo(BigDecimal.ZERO) < 0, "Net pay should be negative for zero attendance");
    }

    @Test
    @DisplayName("EPF Cap Validation (₹15,000 wage ceiling -> ₹1,800/mo cap)")
    void testEpfCapValidation() {
        SalaryStructure salary = new SalaryStructure();
        salary.setCompanyId(1L);
        salary.setEmployeeId(1L);
        salary.setBasicSalary(new BigDecimal("104166.67")); // High CTC
        salary.setHra(new BigDecimal("41666.67"));
        salary.setSpecialAllowance(new BigDecimal("62500.00"));
        salary.setMonthlyGross(new BigDecimal("208333.34"));
        salary.setEpfEmployee(new BigDecimal("1800.00")); // Capped at ₹1,800
        salary.setProfessionalTax(new BigDecimal("200.00"));
        salary.setMonthlyTds(new BigDecimal("25000.00"));

        Attendance attendance = new Attendance(
                1L, 1L, 9, 2026, 26,
                new BigDecimal("26.0"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("26.0"),
                AttendanceSource.MANUAL
        );

        PayrollRecord record = calculationService.calculateForEmployee(sampleEmployee, salary, attendance, 100L);

        assertEquals(new BigDecimal("1800.00"), record.getEpfDeduction());
        assertTrue(record.getNetPay().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Variable Pay Integration - Overtime/Bonus increases gross, Deduction increases total deductions")
    void testVariablePayCalculation() {
        SalaryStructure salary = new SalaryStructure();
        salary.setCompanyId(1L);
        salary.setEmployeeId(1L);
        salary.setBasicSalary(new BigDecimal("50000.00"));
        salary.setHra(new BigDecimal("20000.00"));
        salary.setSpecialAllowance(new BigDecimal("30000.00"));
        salary.setMonthlyGross(new BigDecimal("100000.00"));
        salary.setEpfEmployee(new BigDecimal("1800.00"));
        salary.setProfessionalTax(new BigDecimal("200.00"));
        salary.setMonthlyTds(new BigDecimal("5000.00"));

        Attendance attendance = new Attendance(
                1L, 1L, 9, 2026, 26,
                new BigDecimal("26.0"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("26.0"),
                AttendanceSource.MANUAL
        );

        BigDecimal variableEarnings = new BigDecimal("8000.00"); // e.g. 5000 bonus + 3000 overtime
        BigDecimal variableDeductions = new BigDecimal("1500.00"); // e.g. 1500 penalty/advance recovery

        PayrollRecord record = calculationService.calculateForEmployee(
                sampleEmployee, salary, attendance, 100L, variableEarnings, variableDeductions);

        assertNotNull(record);
        // Gross earned = 100,000 + 8,000 = 108,000.00
        assertEquals(new BigDecimal("108000.00"), record.getGrossEarned());
        // Total deductions = 1800 (EPF) + 200 (PT) + 5000 (TDS) + 1500 (Var Ded) = 8500.00
        assertEquals(new BigDecimal("8500.00"), record.getTotalDeductions());
        // Net pay = 108000 - 8500 = 99500.00
        assertEquals(new BigDecimal("99500.00"), record.getNetPay());
    }
}

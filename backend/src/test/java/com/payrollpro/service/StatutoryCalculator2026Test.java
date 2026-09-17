package com.payrollpro.service;

import com.payrollpro.dto.StatutoryBreakdown2026;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class StatutoryCalculator2026Test {

    private StatutoryCalculator2026 calculator;

    @BeforeEach
    void setUp() {
        calculator = new StatutoryCalculator2026();
    }

    @Test
    @DisplayName("CTC ₹6,00,000: Taxable <= 7L gives 0 TDS due to 87A rebate & ₹75k standard deduction")
    void testSub7LakhZeroTds() {
        BigDecimal ctc = new BigDecimal("600000.00");
        StatutoryBreakdown2026 b = calculator.computeStatutoryBreakdown(ctc, null, null, LocalDate.now());

        assertEquals(new BigDecimal("50000.00"), b.getMonthlyGross());
        assertEquals(new BigDecimal("25000.00"), b.getBasicSalary());
        assertEquals(new BigDecimal("10000.00"), b.getHra());
        assertEquals(new BigDecimal("15000.00"), b.getSpecialAllowance());

        // EPFO Capping at ₹15,000 wage ceiling
        assertEquals(new BigDecimal("15000.00"), b.getEpfWage());
        assertEquals(new BigDecimal("1800.00"), b.getEmployeeEpf());
        assertEquals(new BigDecimal("1250.00"), b.getEmployerEps());
        assertEquals(new BigDecimal("550.00"), b.getEmployerEpf());
        assertEquals(new BigDecimal("75.00"), b.getEdliEmployer());
        assertEquals(new BigDecimal("75.00"), b.getEpfAdminEmployer());
        assertEquals(new BigDecimal("1950.00"), b.getTotalEmployerCost());
        assertEquals(new BigDecimal("3750.00"), b.getTotalEpfoRemittance());

        // 2026 Standard Deduction = ₹75,000
        assertEquals(new BigDecimal("75000.00"), b.getStandardDeduction());
        assertEquals(new BigDecimal("525000.00"), b.getTaxableIncome());

        // 87A Rebate applies -> 0 TDS
        assertEquals(new BigDecimal("0.00"), b.getAnnualTds());
        assertEquals(new BigDecimal("0.00"), b.getMonthlyTds());

        // Net Take Home = 50000 - 1800 - 200 - 0 = 48000
        assertEquals(new BigDecimal("48000.00"), b.getNetTakeHome());
    }

    @Test
    @DisplayName("CTC ₹12,00,000: Accurate 2026 slabs (3-7L 5%, 7-10L 10%, 10-12L 15%) + 4% cess")
    void test12LakhCtcCalculation() {
        BigDecimal ctc = new BigDecimal("1200000.00");
        StatutoryBreakdown2026 b = calculator.computeStatutoryBreakdown(ctc, null, null, LocalDate.now());

        assertEquals(new BigDecimal("100000.00"), b.getMonthlyGross());
        assertEquals(new BigDecimal("50000.00"), b.getBasicSalary());
        assertEquals(new BigDecimal("20000.00"), b.getHra());
        assertEquals(new BigDecimal("30000.00"), b.getSpecialAllowance());

        // EPFO capped
        assertEquals(new BigDecimal("1800.00"), b.getEmployeeEpf());
        assertEquals(new BigDecimal("1250.00"), b.getEmployerEps());
        assertEquals(new BigDecimal("550.00"), b.getEmployerEpf());
        assertEquals(new BigDecimal("75.00"), b.getEdliEmployer());
        assertEquals(new BigDecimal("75.00"), b.getEpfAdminEmployer());

        // Taxable = 12,00,000 - 75,000 = 11,25,000
        assertEquals(new BigDecimal("1125000.00"), b.getTaxableIncome());
        // Tax before cess = (7L-3L)*5% (20k) + (10L-7L)*10% (30k) + (11.25L-10L)*15% (18.75k) = 68,750
        assertEquals(new BigDecimal("68750.00"), b.getAnnualTaxBeforeCess());
        // Cess 4% = 2,750.00
        assertEquals(new BigDecimal("2750.00"), b.getHealthEduCess());
        // Annual TDS = 71,500.00
        assertEquals(new BigDecimal("71500.00"), b.getAnnualTds());
        // Monthly TDS = 71500 / 12 = 5958.33
        assertEquals(new BigDecimal("5958.33"), b.getMonthlyTds());

        // Net Take Home = 100000 - 1800 - 200 - 5958.33 = 92041.67
        assertEquals(new BigDecimal("92041.67"), b.getNetTakeHome());
    }

    @Test
    @DisplayName("Pure function computeNewRegimeTaxBeforeCess computes independently")
    void testPureTaxFunction() {
        // Under 7L taxable
        assertEquals(new BigDecimal("0.00"), StatutoryCalculator2026.computeNewRegimeTaxBeforeCess(new BigDecimal("700000.00")));

        // 8L taxable: 20k (3-7L) + 10k (7-8L) = 30k
        assertEquals(new BigDecimal("30000.00"), StatutoryCalculator2026.computeNewRegimeTaxBeforeCess(new BigDecimal("800000.00")));
    }
}

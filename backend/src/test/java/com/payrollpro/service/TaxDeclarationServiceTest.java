package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.TaxDeclarationRequest;
import com.payrollpro.dto.TaxDeclarationResponse;
import com.payrollpro.model.*;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import com.payrollpro.repository.TaxDeclarationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaxDeclarationServiceTest {

    @Mock
    private TaxDeclarationRepository taxDeclarationRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private SalaryStructureRepository salaryStructureRepository;

    @InjectMocks
    private TaxDeclarationService taxDeclarationService;

    private Employee employee;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(1L);

        employee = new Employee();
        employee.setId(10L);
        employee.setCompanyId(1L);
        employee.setEmpCode("EMP-010");
        employee.setFirstName("Sunil");
        employee.setLastName("Gavaskar");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testNewRegimeBelowThresholdZeroTax() {
        // Income <= 7,00,000 (after 75,000 standard deduction -> 6,25,000 <= 7,00,000 rebate)
        TaxDeclaration decl = new TaxDeclaration();
        decl.setRegime(TaxRegime.NEW_REGIME);

        BigDecimal annualGross = new BigDecimal("700000.00");
        BigDecimal basic = new BigDecimal("35000.00");

        BigDecimal tax = taxDeclarationService.calculateAnnualTax(annualGross, basic, decl);
        assertEquals(0, tax.compareTo(BigDecimal.ZERO), "New regime tax should be zero due to 87A rebate for income <= 7L");
    }

    @Test
    void testNewRegimeHigherIncome() {
        // Income 12,00,000. Taxable = 12L - 75K = 11,25,000
        // Slabs:
        // 3L-6L (3L @ 5%) = 15,000
        // 6L-9L (3L @ 10%) = 30,000
        // 9L-11.25L (2.25L @ 15%) = 33,750
        // Total base = 78,750 * 1.04 cess = 81,900.00
        TaxDeclaration decl = new TaxDeclaration();
        decl.setRegime(TaxRegime.NEW_REGIME);

        BigDecimal annualGross = new BigDecimal("1200000.00");
        BigDecimal basic = new BigDecimal("50000.00");

        BigDecimal tax = taxDeclarationService.calculateAnnualTax(annualGross, basic, decl);
        assertNotNull(tax);
        assertTrue(tax.compareTo(BigDecimal.ZERO) > 0);
        assertEquals(new BigDecimal("81900.00"), tax);
    }

    @Test
    void testOldRegimeWithDeductions() {
        // Income 12,00,000. Deductions: 50K standard + 1.5L 80C + 50K 80D + 2L Sec 24 = 4.5L
        // Taxable = 12L - 4.5L = 7.5L
        // Slabs:
        // 2.5L-5L (2.5L @ 5%) = 12,500
        // 5L-7.5L (2.5L @ 20%) = 50,000
        // Total base = 62,500 * 1.04 = 65,000.00
        TaxDeclaration decl = new TaxDeclaration();
        decl.setRegime(TaxRegime.OLD_REGIME);
        decl.setSection80C(new BigDecimal("150000.00"));
        decl.setSection80D(new BigDecimal("50000.00"));
        decl.setSection24HomeLoan(new BigDecimal("200000.00"));

        BigDecimal annualGross = new BigDecimal("1200000.00");
        BigDecimal basic = new BigDecimal("50000.00");

        BigDecimal tax = taxDeclarationService.calculateAnnualTax(annualGross, basic, decl);
        assertNotNull(tax);
        assertEquals(new BigDecimal("65000.00"), tax);
    }

    @Test
    void testSaveOrUpdateDeclarationCapsDeductions() {
        when(employeeRepository.findByCompanyIdAndId(1L, 10L)).thenReturn(Optional.of(employee));
        when(taxDeclarationRepository.findByCompanyIdAndEmployeeIdAndFinancialYear(1L, 10L, "2026-2027"))
                .thenReturn(Optional.empty());
        when(taxDeclarationRepository.save(any(TaxDeclaration.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        TaxDeclarationRequest req = new TaxDeclarationRequest();
        req.setFinancialYear("2026-2027");
        req.setRegime(TaxRegime.OLD_REGIME);
        req.setSection80C(new BigDecimal("250000.00")); // Exceeds 1.5L limit
        req.setSection80D(new BigDecimal("100000.00")); // Exceeds 75K limit
        req.setSection24HomeLoan(new BigDecimal("300000.00")); // Exceeds 2L limit

        TaxDeclarationResponse res = taxDeclarationService.saveOrUpdateDeclaration(10L, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("150000.00"), res.getSection80C(), "Section 80C must be capped at 1.5L");
        assertEquals(new BigDecimal("75000.00"), res.getSection80D(), "Section 80D must be capped at 75K");
        assertEquals(new BigDecimal("200000.00"), res.getSection24HomeLoan(), "Section 24 must be capped at 2L");
    }
}

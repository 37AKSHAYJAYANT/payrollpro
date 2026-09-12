package com.payrollpro.service;

import com.lowagie.text.pdf.PdfReader;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.SalaryStructure;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class PayslipPdfEncryptionTest {

    private PayslipPdfService payslipPdfService;

    @BeforeEach
    void setUp() {
        payslipPdfService = new PayslipPdfService();
    }

    @Test
    @DisplayName("Password Rule - First 4 uppercase letters of firstName + DOB DDMM")
    void testPasswordGenerationWithDob() {
        Employee employee = new Employee();
        employee.setFirstName("Vikram");
        employee.setLastName("Aditya");
        employee.setDateOfBirth(LocalDate.of(1992, 11, 24));

        String password = payslipPdfService.generatePayslipPassword(employee);

        assertEquals("VIKR2411", password);
    }

    @Test
    @DisplayName("Password Rule - Default to 0101 if DOB is null")
    void testPasswordGenerationWithNullDob() {
        Employee employee = new Employee();
        employee.setFirstName("Vikram");
        employee.setLastName("Sharma");
        employee.setDateOfBirth(null);

        String password = payslipPdfService.generatePayslipPassword(employee);

        assertEquals("VIKR0101", password);
    }

    @Test
    @DisplayName("Password Rule - Pad with X if firstName is shorter than 4 letters")
    void testPasswordGenerationShortName() {
        Employee employee = new Employee();
        employee.setFirstName("Ali");
        employee.setLastName("Khan");
        employee.setDateOfBirth(LocalDate.of(1995, 3, 7));

        String password = payslipPdfService.generatePayslipPassword(employee);

        assertEquals("ALIX0703", password);
    }

    @Test
    @DisplayName("Password Rule - Lowercase firstName is converted to uppercase")
    void testPasswordGenerationLowercaseName() {
        Employee employee = new Employee();
        employee.setFirstName("pooja");
        employee.setLastName("Verma");
        employee.setDateOfBirth(null);

        String password = payslipPdfService.generatePayslipPassword(employee);

        assertEquals("POOJ0101", password);
    }

    @Test
    @DisplayName("Generate Encrypted Payslip PDF - Successfully opens with correct password and rejects invalid password")
    void testEncryptedPdfGeneration() throws Exception {
        Company company = new Company();
        company.setId(1L);
        company.setName("Acme Tech Solutions");
        company.setAddress("Bangalore, Karnataka");

        Employee employee = new Employee();
        employee.setId(10L);
        employee.setEmpCode("EMP-010");
        employee.setFirstName("Vikram");
        employee.setLastName("Malhotra");
        employee.setDateOfBirth(LocalDate.of(1990, 8, 15));

        PayrollRecord record = new PayrollRecord();
        record.setId(100L);
        record.setCompanyId(1L);
        record.setEmployeeId(10L);
        record.setMonth(9);
        record.setYear(2026);
        record.setPayslipRef("PSLIP-2026-09-010");
        record.setTotalWorkingDays(30);
        record.setPayableDays(new BigDecimal("30.00"));
        record.setBasicEarned(new BigDecimal("40000.00"));
        record.setHraEarned(new BigDecimal("16000.00"));
        record.setSpecialAllowanceEarned(new BigDecimal("14000.00"));
        record.setGrossEarned(new BigDecimal("70000.00"));
        record.setEpfDeduction(new BigDecimal("4800.00"));
        record.setProfessionalTax(new BigDecimal("200.00"));
        record.setTdsDeduction(new BigDecimal("2500.00"));
        record.setTotalDeductions(new BigDecimal("7500.00"));
        record.setNetPay(new BigDecimal("62500.00"));

        SalaryStructure structure = new SalaryStructure();

        // Expected password: "VIKR" + "1508" = "VIKR1508"
        String expectedPassword = "VIKR1508";
        assertEquals(expectedPassword, payslipPdfService.generatePayslipPassword(employee));

        byte[] encryptedPdfBytes = payslipPdfService.generateEncryptedPayslipPdf(record, employee, structure, company);

        assertNotNull(encryptedPdfBytes);
        assertTrue(encryptedPdfBytes.length > 0);

        // Verification 1: Reading with correct password succeeds and confirms encryption
        PdfReader readerWithCorrectPassword = new PdfReader(encryptedPdfBytes, expectedPassword.getBytes(StandardCharsets.UTF_8));
        assertTrue(readerWithCorrectPassword.isEncrypted(), "PDF must be encrypted");
        assertEquals(1, readerWithCorrectPassword.getNumberOfPages(), "PDF must contain 1 page");
        readerWithCorrectPassword.close();

        // Verification 2: Reading with wrong password fails
        assertThrows(Exception.class, () -> {
            new PdfReader(encryptedPdfBytes, "INCORRECT_PASS".getBytes(StandardCharsets.UTF_8));
        }, "Opening encrypted PDF with incorrect password must throw an exception");

        // Verification 3: Reading without password fails
        assertThrows(Exception.class, () -> {
            new PdfReader(encryptedPdfBytes);
        }, "Opening encrypted PDF without password must throw an exception");
    }
}

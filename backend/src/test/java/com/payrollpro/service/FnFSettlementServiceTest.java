package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.FnFSettlementCalculationRequest;
import com.payrollpro.dto.FnFSettlementResponse;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.FnFSettlement;
import com.payrollpro.model.FnFSettlementStatus;
import com.payrollpro.model.LeaveBalance;
import com.payrollpro.model.LeaveType;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.FnFSettlementRepository;
import com.payrollpro.repository.LeaveBalanceRepository;
import com.payrollpro.repository.LeaveTypeRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FnFSettlementServiceTest {

    @Mock
    private FnFSettlementRepository fnfSettlementRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private SalaryStructureRepository salaryStructureRepository;

    @Mock
    private LeaveTypeRepository leaveTypeRepository;

    @Mock
    private LeaveBalanceRepository leaveBalanceRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private FnFSettlementService fnfSettlementService;

    private Long companyId = 1L;
    private Long empId = 10L;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(companyId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Calculate Settlement - Eligible for Gratuity (Tenure >= 5 Years)")
    void testGratuityCalculationForEligibleEmployee() {
        Employee emp = new Employee();
        emp.setId(empId);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-010");
        emp.setFirstName("Vikram");
        emp.setLastName("Patel");
        emp.setDateOfJoining(LocalDate.of(2019, 1, 1)); // 6+ years

        SalaryStructure sal = new SalaryStructure();
        sal.setCompanyId(companyId);
        sal.setEmployeeId(empId);
        sal.setBasicSalary(new BigDecimal("50000.00"));
        sal.setMonthlyGross(new BigDecimal("100000.00"));

        LeaveType elType = new LeaveType(companyId, "Earned Leave", "EL", 15, false);
        elType.setId(5L);

        LeaveBalance elBal = new LeaveBalance(companyId, empId, 5L, 2026, new BigDecimal("15.0"));
        elBal.setRemaining(new BigDecimal("10.0"));

        when(employeeRepository.findByCompanyIdAndId(companyId, empId)).thenReturn(Optional.of(emp));
        when(salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, empId)).thenReturn(Optional.of(sal));
        when(leaveTypeRepository.findByCompanyIdAndCode(companyId, "EL")).thenReturn(Optional.of(elType));
        when(leaveBalanceRepository.findByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(companyId, empId, 5L, 2026))
                .thenReturn(Optional.of(elBal));

        FnFSettlementCalculationRequest req = new FnFSettlementCalculationRequest();
        req.setEmployeeId(empId);
        req.setResignationDate(LocalDate.of(2026, 8, 1));
        req.setLastWorkingDate(LocalDate.of(2026, 9, 1));
        req.setNoticePeriodDays(30);
        req.setServedDays(30); // Full notice served, no recovery

        FnFSettlementResponse resp = fnfSettlementService.calculatePreview(req);

        assertNotNull(resp);
        assertEquals(7, resp.getCompletedYearsOfService());
        // Gratuity = (15 * 50000 * 7) / 26 = 201923.08
        assertEquals(new BigDecimal("201923.08"), resp.getGratuityAmount());
        // EL Encashment = (50000 / 26) * 10 = 19230.77
        assertEquals(new BigDecimal("19230.77"), resp.getLeaveEncashmentAmount());
        assertEquals(BigDecimal.ZERO, resp.getNoticeRecoveryAmount());
        // Net = 201923.08 + 19230.77 = 221153.85
        assertEquals(new BigDecimal("221153.85"), resp.getNetSettlementAmount());
    }

    @Test
    @DisplayName("Calculate Settlement - Ineligible for Gratuity (Tenure < 5 Years) with Notice Shortfall")
    void testSettlementWithNoticeShortfallAndNoGratuity() {
        Employee emp = new Employee();
        emp.setId(empId);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-011");
        emp.setFirstName("Rhea");
        emp.setLastName("Sen");
        emp.setDateOfJoining(LocalDate.of(2024, 1, 1)); // ~2.5 years (under 5 years)

        SalaryStructure sal = new SalaryStructure();
        sal.setCompanyId(companyId);
        sal.setEmployeeId(empId);
        sal.setBasicSalary(new BigDecimal("40000.00"));
        sal.setMonthlyGross(new BigDecimal("80000.00"));

        when(employeeRepository.findByCompanyIdAndId(companyId, empId)).thenReturn(Optional.of(emp));
        when(salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, empId)).thenReturn(Optional.of(sal));
        when(leaveTypeRepository.findByCompanyIdAndCode(companyId, "EL")).thenReturn(Optional.empty());

        FnFSettlementCalculationRequest req = new FnFSettlementCalculationRequest();
        req.setEmployeeId(empId);
        req.setResignationDate(LocalDate.of(2026, 8, 15));
        req.setLastWorkingDate(LocalDate.of(2026, 9, 1));
        req.setNoticePeriodDays(30);
        req.setServedDays(15); // 15 days shortfall!

        FnFSettlementResponse resp = fnfSettlementService.calculatePreview(req);

        assertNotNull(resp);
        assertEquals(2, resp.getCompletedYearsOfService());
        assertEquals(BigDecimal.ZERO, resp.getGratuityAmount());
        // Notice recovery = (80000 / 30) * 15 = 40000.00
        assertEquals(new BigDecimal("40000.00"), resp.getNoticeRecoveryAmount());
        // Net settlement is negative 40000.00 (employee owes notice recovery)
        assertEquals(new BigDecimal("-40000.00"), resp.getNetSettlementAmount());
    }

    @Test
    @DisplayName("Generate Settlement Statement PDF - Produces Non-Empty PDF")
    void testGenerateSettlementPdf() {
        FnFSettlement settlement = new FnFSettlement();
        settlement.setId(100L);
        settlement.setCompanyId(companyId);
        settlement.setEmployeeId(empId);
        settlement.setResignationDate(LocalDate.of(2026, 8, 1));
        settlement.setLastWorkingDate(LocalDate.of(2026, 9, 1));
        settlement.setLeaveEncashmentAmount(new BigDecimal("25000.00"));
        settlement.setGratuityAmount(new BigDecimal("150000.00"));
        settlement.setNetSettlementAmount(new BigDecimal("175000.00"));
        settlement.setStatus(FnFSettlementStatus.APPROVED);

        Company comp = new Company("Acme Technologies");
        comp.setId(companyId);

        Employee emp = new Employee();
        emp.setId(empId);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-010");
        emp.setFirstName("Vikram");
        emp.setLastName("Patel");
        emp.setDepartment("Engineering");
        emp.setDateOfJoining(LocalDate.of(2019, 1, 1));

        when(fnfSettlementRepository.findByCompanyIdAndId(companyId, 100L)).thenReturn(Optional.of(settlement));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(comp));
        when(employeeRepository.findByCompanyIdAndId(companyId, empId)).thenReturn(Optional.of(emp));

        byte[] pdf = fnfSettlementService.generateSettlementPdf(100L);
        assertNotNull(pdf);
        assertTrue(pdf.length > 500);
    }
}

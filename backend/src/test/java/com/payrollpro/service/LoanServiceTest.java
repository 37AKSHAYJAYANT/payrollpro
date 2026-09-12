package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.LoanApplicationRequest;
import com.payrollpro.dto.LoanResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.LoanRecord;
import com.payrollpro.model.LoanStatus;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.LoanRecordRepository;
import com.payrollpro.repository.LoanRepaymentRepository;
import com.payrollpro.repository.UserRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRecordRepository loanRecordRepository;

    @Mock
    private LoanRepaymentRepository loanRepaymentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LoanService loanService;

    private Long companyId = 1L;
    private Long empId = 5L;

    @BeforeEach
    void setUp() {
        TenantContext.setCompanyId(companyId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Apply For Loan - Correctly Computes Monthly EMI and Status")
    void testApplyForLoan() {
        Employee emp = new Employee();
        emp.setId(empId);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-005");
        emp.setFirstName("Sunil");
        emp.setLastName("Kumar");

        when(employeeRepository.findByCompanyIdAndId(companyId, empId)).thenReturn(Optional.of(emp));
        when(loanRecordRepository.save(any(LoanRecord.class))).thenAnswer(inv -> {
            LoanRecord l = inv.getArgument(0);
            l.setId(101L);
            return l;
        });

        LoanApplicationRequest req = new LoanApplicationRequest();
        req.setEmployeeId(empId);
        req.setPrincipalAmount(new BigDecimal("60000.00"));
        req.setTenureMonths(6);
        req.setReason("Medical emergency");

        LoanResponse resp = loanService.applyForLoan(req);

        assertNotNull(resp);
        assertEquals(new BigDecimal("60000.00"), resp.getPrincipalAmount());
        assertEquals(6, resp.getTenureMonths());
        // EMI = 60000 / 6 = 10000.00
        assertEquals(new BigDecimal("10000.00"), resp.getMonthlyEmi());
        assertEquals(LoanStatus.REQUESTED, resp.getStatus());
        assertEquals("Medical emergency", resp.getReason());
    }

    @Test
    @DisplayName("Approve Loan - Transitions Status to ACTIVE and Sets Disbursed Date")
    void testApproveLoan() {
        LoanRecord loan = new LoanRecord();
        loan.setId(101L);
        loan.setCompanyId(companyId);
        loan.setEmployeeId(empId);
        loan.setPrincipalAmount(new BigDecimal("30000.00"));
        loan.setTenureMonths(3);
        loan.setMonthlyEmi(new BigDecimal("10000.00"));
        loan.setRemainingPrincipal(new BigDecimal("30000.00"));
        loan.setStatus(LoanStatus.REQUESTED);

        Employee emp = new Employee();
        emp.setId(empId);
        emp.setCompanyId(companyId);
        emp.setEmpCode("EMP-005");
        emp.setFirstName("Sunil");
        emp.setLastName("Kumar");

        when(loanRecordRepository.findByCompanyIdAndId(companyId, 101L)).thenReturn(Optional.of(loan));
        when(loanRecordRepository.save(any(LoanRecord.class))).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.findByCompanyIdAndId(companyId, empId)).thenReturn(Optional.of(emp));

        LoanResponse resp = loanService.approveLoan(101L);

        assertNotNull(resp);
        assertEquals(LoanStatus.ACTIVE, resp.getStatus());
        assertNotNull(resp.getDisbursedDate());
    }

    @Test
    @DisplayName("Apply For Loan - Throws Bad Request When Principal Is Non-Positive")
    void testApplyZeroPrincipalThrowsBadRequest() {
        Employee emp = new Employee();
        emp.setId(empId);
        emp.setCompanyId(companyId);

        when(employeeRepository.findByCompanyIdAndId(companyId, empId)).thenReturn(Optional.of(emp));

        LoanApplicationRequest req = new LoanApplicationRequest();
        req.setEmployeeId(empId);
        req.setPrincipalAmount(BigDecimal.ZERO);
        req.setTenureMonths(6);

        assertThrows(ResponseStatusException.class, () -> loanService.applyForLoan(req));
    }
}

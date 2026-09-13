package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.LoanApplicationRequest;
import com.payrollpro.dto.LoanResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.LoanRecord;
import com.payrollpro.model.LoanStatus;
import com.payrollpro.model.User;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.LoanRecordRepository;
import com.payrollpro.repository.LoanRepaymentRepository;
import com.payrollpro.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanService {

    private final LoanRecordRepository loanRecordRepository;
    private final LoanRepaymentRepository loanRepaymentRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public LoanService(LoanRecordRepository loanRecordRepository,
                       LoanRepaymentRepository loanRepaymentRepository,
                       EmployeeRepository employeeRepository,
                       UserRepository userRepository) {
        this.loanRecordRepository = loanRecordRepository;
        this.loanRepaymentRepository = loanRepaymentRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    private Long getAuthenticatedEmployeeId() {
        User user = com.payrollpro.util.SecurityUtils.getCurrentUser(userRepository);
        if (user.getEmployeeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User account is not linked to an employee record");
        }
        return user.getEmployeeId();
    }

    @Transactional
    public LoanResponse applyForLoan(LoanApplicationRequest request) {
        Long companyId = getRequiredCompanyId();
        Long employeeId = request.getEmployeeId();
        if (employeeId == null) {
            employeeId = getAuthenticatedEmployeeId();
        }

        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        if (request.getPrincipalAmount() == null || request.getPrincipalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Principal amount must be greater than zero");
        }

        int tenure = (request.getTenureMonths() != null && request.getTenureMonths() > 0) ? request.getTenureMonths() : 6;
        if (tenure > 36) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum loan tenure is 36 months");
        }

        BigDecimal emi = request.getPrincipalAmount().divide(BigDecimal.valueOf(tenure), 2, RoundingMode.HALF_UP);

        LoanRecord loan = new LoanRecord();
        loan.setCompanyId(companyId);
        loan.setEmployeeId(emp.getId());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setTenureMonths(tenure);
        loan.setMonthlyEmi(emi);
        loan.setRemainingPrincipal(request.getPrincipalAmount());
        loan.setStatus(LoanStatus.REQUESTED);
        loan.setReason(request.getReason());

        LoanRecord saved = loanRecordRepository.save(loan);
        return mapToResponse(saved, emp);
    }

    @Transactional
    public LoanResponse approveLoan(Long loanId) {
        Long companyId = getRequiredCompanyId();
        LoanRecord loan = loanRecordRepository.findByCompanyIdAndId(companyId, loanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan record not found"));

        loan.setStatus(LoanStatus.ACTIVE);
        loan.setDisbursedDate(LocalDate.now());
        LoanRecord saved = loanRecordRepository.save(loan);

        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, saved.getEmployeeId()).orElse(null);
        return mapToResponse(saved, emp);
    }

    @Transactional
    public LoanResponse rejectLoan(Long loanId) {
        Long companyId = getRequiredCompanyId();
        LoanRecord loan = loanRecordRepository.findByCompanyIdAndId(companyId, loanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan record not found"));

        loan.setStatus(LoanStatus.REJECTED);
        LoanRecord saved = loanRecordRepository.save(loan);

        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, saved.getEmployeeId()).orElse(null);
        return mapToResponse(saved, emp);
    }

    public List<LoanResponse> getLoansForEmployee(Long employeeId) {
        Long companyId = getRequiredCompanyId();
        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, employeeId).orElse(null);
        return loanRecordRepository.findAllByCompanyIdAndEmployeeId(companyId, employeeId).stream()
                .map(loan -> mapToResponse(loan, emp))
                .collect(Collectors.toList());
    }

    public List<LoanResponse> getMyLoans() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getEmployeeId() == null) {
            // Check by email fallback or return empty list
            Long companyId = getRequiredCompanyId();
            Employee emp = employeeRepository.findAllByCompanyId(companyId).stream()
                    .filter(e -> e.getEmail().equalsIgnoreCase(user.getEmail()))
                    .findFirst()
                    .orElse(null);
            if (emp == null) {
                return Collections.emptyList();
            }
            return getLoansForEmployee(emp.getId());
        }
        return getLoansForEmployee(user.getEmployeeId());
    }

    public List<LoanResponse> getAllLoans() {
        Long companyId = getRequiredCompanyId();
        List<LoanRecord> loans = loanRecordRepository.findAllByCompanyId(companyId);
        return mapLoansWithEmployees(companyId, loans);
    }

    public List<LoanResponse> getPendingLoans() {
        Long companyId = getRequiredCompanyId();
        List<LoanRecord> loans = loanRecordRepository.findAllByCompanyIdAndStatus(companyId, LoanStatus.REQUESTED);
        return mapLoansWithEmployees(companyId, loans);
    }

    private List<LoanResponse> mapLoansWithEmployees(Long companyId, List<LoanRecord> loans) {
        if (loans.isEmpty()) {
            return Collections.emptyList();
        }
        java.util.Set<Long> empIds = loans.stream().map(LoanRecord::getEmployeeId).collect(Collectors.toSet());
        java.util.Map<Long, Employee> empMap = employeeRepository.findByCompanyIdAndIdIn(companyId, empIds).stream()
                .collect(Collectors.toMap(Employee::getId, java.util.function.Function.identity()));

        return loans.stream()
                .map(loan -> {
                    Employee emp = empMap.get(loan.getEmployeeId());
                    if (emp == null) {
                        emp = employeeRepository.findByCompanyIdAndId(companyId, loan.getEmployeeId()).orElse(null);
                    }
                    return mapToResponse(loan, emp);
                })
                .collect(Collectors.toList());
    }

    private LoanResponse mapToResponse(LoanRecord l, Employee emp) {
        LoanResponse resp = new LoanResponse();
        resp.setId(l.getId());
        resp.setEmployeeId(l.getEmployeeId());
        resp.setEmpCode(emp != null ? emp.getEmpCode() : "N/A");
        resp.setEmployeeName(emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown");
        resp.setPrincipalAmount(l.getPrincipalAmount());
        resp.setTenureMonths(l.getTenureMonths());
        resp.setMonthlyEmi(l.getMonthlyEmi());
        resp.setRemainingPrincipal(l.getRemainingPrincipal());
        resp.setStatus(l.getStatus());
        resp.setReason(l.getReason());
        resp.setDisbursedDate(l.getDisbursedDate());
        resp.setCreatedAt(l.getCreatedAt());
        return resp;
    }
}

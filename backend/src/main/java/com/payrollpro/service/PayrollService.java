package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.PayrollRecordResponse;
import com.payrollpro.dto.PayrollRunResponse;
import com.payrollpro.model.Attendance;
import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import com.payrollpro.model.ExpenseClaim;
import com.payrollpro.model.ExpenseClaimStatus;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.model.PayrollRunStatus;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.model.TaxDeclaration;
import com.payrollpro.model.User;
import com.payrollpro.repository.AttendanceRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.ExpenseClaimRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import com.payrollpro.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final PayrollCalculationService payrollCalculationService;
    private final com.payrollpro.repository.LoanRecordRepository loanRecordRepository;
    private final com.payrollpro.repository.LoanRepaymentRepository loanRepaymentRepository;
    private final com.payrollpro.repository.TaxDeclarationRepository taxDeclarationRepository;
    private final TaxDeclarationService taxDeclarationService;
    private final com.payrollpro.repository.VariablePayRecordRepository variablePayRecordRepository;
    private final ExpenseClaimRepository expenseClaimRepository;
    private final ExpenseClaimService expenseClaimService;

    public PayrollService(PayrollRunRepository payrollRunRepository,
                          PayrollRecordRepository payrollRecordRepository,
                          EmployeeRepository employeeRepository,
                          SalaryStructureRepository salaryStructureRepository,
                          AttendanceRepository attendanceRepository,
                          UserRepository userRepository,
                          PayrollCalculationService payrollCalculationService,
                          com.payrollpro.repository.LoanRecordRepository loanRecordRepository,
                          com.payrollpro.repository.LoanRepaymentRepository loanRepaymentRepository,
                          com.payrollpro.repository.TaxDeclarationRepository taxDeclarationRepository,
                          TaxDeclarationService taxDeclarationService,
                          com.payrollpro.repository.VariablePayRecordRepository variablePayRecordRepository,
                          ExpenseClaimRepository expenseClaimRepository,
                          ExpenseClaimService expenseClaimService) {
        this.payrollRunRepository = payrollRunRepository;
        this.payrollRecordRepository = payrollRecordRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.payrollCalculationService = payrollCalculationService;
        this.loanRecordRepository = loanRecordRepository;
        this.loanRepaymentRepository = loanRepaymentRepository;
        this.taxDeclarationRepository = taxDeclarationRepository;
        this.taxDeclarationService = taxDeclarationService;
        this.variablePayRecordRepository = variablePayRecordRepository;
        this.expenseClaimRepository = expenseClaimRepository;
        this.expenseClaimService = expenseClaimService;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    private User getAuthenticatedUser() {
        return com.payrollpro.util.SecurityUtils.getCurrentUser(userRepository);
    }

    @Transactional
    public PayrollRunResponse executePayrollRun(int month, int year) {
        Long companyId = getRequiredCompanyId();
        User currentUser = getAuthenticatedUser();

        // Check if payroll run already exists for this period
        Optional<PayrollRun> existingRunOpt = payrollRunRepository.findByCompanyIdAndYearAndMonth(companyId, year, month);
        PayrollRun payrollRun;

        if (existingRunOpt.isPresent()) {
            payrollRun = existingRunOpt.get();
            if (payrollRun.getStatus() == PayrollRunStatus.LOCKED) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payroll for " + month + "/" + year + " is LOCKED and cannot be re-run");
            }
            // Delete old records for re-run
            payrollRecordRepository.deleteAllByCompanyIdAndPayrollRunId(companyId, payrollRun.getId());
            loanRepaymentRepository.deleteAllByCompanyIdAndPayrollRunId(companyId, payrollRun.getId());
        } else {
            payrollRun = new PayrollRun();
            payrollRun.setCompanyId(companyId);
            payrollRun.setMonth(month);
            payrollRun.setYear(year);
            payrollRun.setStatus(PayrollRunStatus.DRAFT);
            payrollRun.setEmployeeCount(0);
            payrollRun.setTotalGrossPay(BigDecimal.ZERO);
            payrollRun.setTotalDeductions(BigDecimal.ZERO);
            payrollRun.setTotalNetPay(BigDecimal.ZERO);
            payrollRun.setPreparedBy(currentUser.getId());
            payrollRun.setPreparedAt(LocalDateTime.now());
            payrollRun = payrollRunRepository.save(payrollRun);
        }

        // Fetch all ACTIVE employees
        List<Employee> activeEmployees = employeeRepository.findAllByCompanyId(companyId).stream()
                .filter(e -> e.getStatus() == EmployeeStatus.ACTIVE)
                .collect(Collectors.toList());

        if (activeEmployees.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active employees found for payroll processing");
        }

        // Preload salaries, attendances, and variable pay
        Map<Long, SalaryStructure> salaryMap = salaryStructureRepository.findAll().stream()
                .filter(s -> s.getCompanyId().equals(companyId))
                .collect(Collectors.toMap(SalaryStructure::getEmployeeId, s -> s));

        Map<Long, Attendance> attendanceMap = attendanceRepository.findAllByCompanyIdAndYearAndMonth(companyId, year, month).stream()
                .collect(Collectors.toMap(Attendance::getEmployeeId, a -> a));

        List<com.payrollpro.model.VariablePayRecord> varPayList = variablePayRecordRepository
                .findAllByCompanyIdAndYearAndMonth(companyId, year, month);
        Map<Long, List<com.payrollpro.model.VariablePayRecord>> varPayMap = varPayList.stream()
                .collect(Collectors.groupingBy(com.payrollpro.model.VariablePayRecord::getEmployeeId));

        List<PayrollRecord> records = new ArrayList<>(activeEmployees.size());
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        for (Employee emp : activeEmployees) {
            SalaryStructure salary = salaryMap.get(emp.getId());
            if (salary == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Missing salary structure for employee " + emp.getEmpCode() + " (" + emp.getFirstName() + " " + emp.getLastName() + ")");
            }

            Attendance attendance = attendanceMap.get(emp.getId());
            if (attendance == null) {
                // If attendance wasn't logged, create full attendance default (26 days)
                attendance = new Attendance(companyId, emp.getId(), month, year, 26,
                        new BigDecimal("26.0"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("26.0"),
                        com.payrollpro.model.AttendanceSource.MANUAL);
                attendance = attendanceRepository.save(attendance);
            }

            List<com.payrollpro.model.VariablePayRecord> empVarPays = varPayMap.getOrDefault(emp.getId(), java.util.Collections.emptyList());
            BigDecimal varEarnings = BigDecimal.ZERO;
            BigDecimal varDeductions = BigDecimal.ZERO;
            for (com.payrollpro.model.VariablePayRecord vp : empVarPays) {
                if (vp.getAmount() == null) continue;
                if (vp.getType() == com.payrollpro.model.VariablePayType.OVERTIME
                        || vp.getType() == com.payrollpro.model.VariablePayType.BONUS
                        || vp.getType() == com.payrollpro.model.VariablePayType.INCENTIVE) {
                    varEarnings = varEarnings.add(vp.getAmount());
                } else if (vp.getType() == com.payrollpro.model.VariablePayType.DEDUCTION) {
                    varDeductions = varDeductions.add(vp.getAmount());
                }
            }

            PayrollRecord record = payrollCalculationService.calculateForEmployee(
                    emp, salary, attendance, payrollRun.getId(), varEarnings, varDeductions);

            // Dynamic TDS adjustment based on active TaxDeclaration
            String fy = (month >= 4) ? year + "-" + (year + 1) : (year - 1) + "-" + year;
            Optional<TaxDeclaration> declOpt = taxDeclarationRepository
                    .findByCompanyIdAndEmployeeIdAndFinancialYear(companyId, emp.getId(), fy);
            if (declOpt.isPresent()) {
                TaxDeclaration decl = declOpt.get();
                BigDecimal annualGross = (salary.getMonthlyGross() != null)
                        ? salary.getMonthlyGross().multiply(BigDecimal.valueOf(12))
                        : salary.getAnnualCTC();
                BigDecimal annualTax = taxDeclarationService.calculateAnnualTax(annualGross, salary.getBasicSalary(), decl);
                BigDecimal monthlyTds = annualTax.divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP);

                // Adjust record TDS and net pay accordingly
                BigDecimal oldTds = record.getTdsDeduction() != null ? record.getTdsDeduction() : BigDecimal.ZERO;
                BigDecimal diff = monthlyTds.subtract(oldTds);
                record.setTdsDeduction(monthlyTds);
                record.setTotalDeductions(record.getTotalDeductions().add(diff));
                record.setNetPay(record.getGrossEarned().subtract(record.getTotalDeductions()));
            }

            // Automated Loan EMI deduction
            List<com.payrollpro.model.LoanRecord> activeLoans = loanRecordRepository.findAllByCompanyIdAndEmployeeIdAndStatus(
                    companyId, emp.getId(), com.payrollpro.model.LoanStatus.ACTIVE);
            for (com.payrollpro.model.LoanRecord loan : activeLoans) {
                BigDecimal emi = loan.getMonthlyEmi().min(loan.getRemainingPrincipal());
                if (emi.compareTo(BigDecimal.ZERO) > 0 && record.getNetPay().compareTo(emi) >= 0) {
                    record.setNetPay(record.getNetPay().subtract(emi));
                    record.setTotalDeductions(record.getTotalDeductions().add(emi));
                    loan.setRemainingPrincipal(loan.getRemainingPrincipal().subtract(emi));
                    if (loan.getRemainingPrincipal().compareTo(BigDecimal.ZERO) <= 0) {
                        loan.setStatus(com.payrollpro.model.LoanStatus.CLOSED);
                    }
                    loanRecordRepository.save(loan);

                    com.payrollpro.model.LoanRepayment repayment = new com.payrollpro.model.LoanRepayment(
                            companyId, loan.getId(), emp.getId(), payrollRun.getId(), emi, month, year);
                    loanRepaymentRepository.save(repayment);
                }
            }

            // Expense Reimbursements: automatically bundle approved expense claims into net payout as non-taxable additions
            List<ExpenseClaim> approvedClaims = expenseClaimService.getApprovedClaimsForMonth(companyId, emp.getId(), month, year);
            BigDecimal totalReimbursements = BigDecimal.ZERO;
            for (ExpenseClaim claim : approvedClaims) {
                if (claim.getAmount() != null && claim.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                    totalReimbursements = totalReimbursements.add(claim.getAmount());
                    claim.setStatus(ExpenseClaimStatus.DISBURSED);
                    expenseClaimRepository.save(claim);
                }
            }
            record.setReimbursements(totalReimbursements);
            record.setNetPay(record.getNetPay().add(totalReimbursements));

            records.add(record);

            totalGross = totalGross.add(record.getGrossEarned());
            totalDeductions = totalDeductions.add(record.getTotalDeductions());
            totalNet = totalNet.add(record.getNetPay());
        }

        payrollRecordRepository.saveAll(records);

        payrollRun.setEmployeeCount(records.size());
        payrollRun.setTotalGrossPay(totalGross);
        payrollRun.setTotalDeductions(totalDeductions);
        payrollRun.setTotalNetPay(totalNet);
        payrollRun.setStatus(PayrollRunStatus.DRAFT);
        payrollRun = payrollRunRepository.save(payrollRun);

        return new PayrollRunResponse(payrollRun);
    }

    public List<PayrollRunResponse> getAllPayrollRuns() {
        Long companyId = getRequiredCompanyId();
        return payrollRunRepository.findAllByCompanyIdOrderByYearDescMonthDesc(companyId).stream()
                .map(PayrollRunResponse::new)
                .collect(Collectors.toList());
    }

    public PayrollRunResponse getPayrollRunById(Long id) {
        Long companyId = getRequiredCompanyId();
        PayrollRun run = payrollRunRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));
        return new PayrollRunResponse(run);
    }

    public List<PayrollRecordResponse> getPayrollRecordsForRun(Long runId) {
        Long companyId = getRequiredCompanyId();
        payrollRunRepository.findByCompanyIdAndId(companyId, runId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, runId);
        Map<Long, Employee> empMap = employeeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        return records.stream()
                .map(r -> new PayrollRecordResponse(r, empMap.get(r.getEmployeeId())))
                .collect(Collectors.toList());
    }

    // ---- 3-Step Approval Workflow ----

    @Transactional
    public PayrollRunResponse reviewPayrollRun(Long id) {
        Long companyId = getRequiredCompanyId();
        User reviewer = getAuthenticatedUser();

        PayrollRun run = payrollRunRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));

        if (run.getStatus() != PayrollRunStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid state transition: Cannot review a run in " + run.getStatus() + " status. Expected DRAFT.");
        }

        run.setStatus(PayrollRunStatus.MANAGER_REVIEWED);
        run.setReviewedBy(reviewer.getId());
        run.setReviewedAt(LocalDateTime.now());
        run = payrollRunRepository.save(run);

        return new PayrollRunResponse(run);
    }

    @Transactional
    public PayrollRunResponse approvePayrollRun(Long id) {
        Long companyId = getRequiredCompanyId();
        User approver = getAuthenticatedUser();

        PayrollRun run = payrollRunRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));

        if (run.getStatus() != PayrollRunStatus.MANAGER_REVIEWED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid state transition: Cannot approve a run in " + run.getStatus() + " status. Must be reviewed by manager first.");
        }

        run.setStatus(PayrollRunStatus.APPROVED);
        run.setApprovedBy(approver.getId());
        run.setApprovedAt(LocalDateTime.now());
        run = payrollRunRepository.save(run);

        return new PayrollRunResponse(run);
    }

    @Transactional
    public PayrollRunResponse lockPayrollRun(Long id) {
        Long companyId = getRequiredCompanyId();

        PayrollRun run = payrollRunRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));

        if (run.getStatus() != PayrollRunStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid state transition: Cannot lock a run in " + run.getStatus() + " status. Must be APPROVED first.");
        }

        run.setStatus(PayrollRunStatus.LOCKED);
        run = payrollRunRepository.save(run);

        return new PayrollRunResponse(run);
    }
}

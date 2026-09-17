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
        PayrollRun payrollRun = getOrCreateDraftRun(companyId, month, year, currentUser.getId());

        List<Employee> activeEmployees = employeeRepository.findAllByCompanyId(companyId).stream()
                .filter(e -> e.getStatus() == EmployeeStatus.ACTIVE)
                .collect(Collectors.toList());

        if (activeEmployees.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active employees found for payroll processing");
        }

        Map<Long, SalaryStructure> salaryMap = salaryStructureRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(SalaryStructure::getEmployeeId, s -> s, (s1, s2) -> s2));
        Map<Long, Attendance> attendanceMap = attendanceRepository.findAllByCompanyIdAndYearAndMonth(companyId, year, month).stream()
                .collect(Collectors.toMap(Attendance::getEmployeeId, a -> a, (a1, a2) -> a2));
        Map<Long, List<com.payrollpro.model.VariablePayRecord>> varPayMap = variablePayRecordRepository
                .findAllByCompanyIdAndYearAndMonth(companyId, year, month).stream()
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

            Attendance attendance = resolveAttendance(companyId, emp.getId(), month, year, attendanceMap);
            BigDecimal[] varAmounts = calculateVariablePayAmounts(varPayMap.get(emp.getId()));

            PayrollRecord record = payrollCalculationService.calculateForEmployee(
                    emp, salary, attendance, payrollRun.getId(), varAmounts[0], varAmounts[1]);

            applyTaxAdjustment(companyId, emp.getId(), month, year, salary, record);
            applyLoanDeductions(companyId, emp.getId(), payrollRun.getId(), month, year, record);
            applyApprovedReimbursements(companyId, emp.getId(), month, year, record);

            records.add(record);
            totalGross = totalGross.add(record.getGrossEarned());
            totalDeductions = totalDeductions.add(record.getTotalDeductions());
            totalNet = totalNet.add(record.getNetPay());
        }

        payrollRecordRepository.saveAll(records);
        return saveAndCompleteRun(payrollRun, records.size(), totalGross, totalDeductions, totalNet);
    }

    private PayrollRun getOrCreateDraftRun(Long companyId, int month, int year, Long currentUserId) {
        Optional<PayrollRun> existingRunOpt = payrollRunRepository.findByCompanyIdAndYearAndMonth(companyId, year, month);
        if (existingRunOpt.isPresent()) {
            PayrollRun run = existingRunOpt.get();
            if (run.getStatus() == PayrollRunStatus.LOCKED) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payroll for " + month + "/" + year + " is LOCKED and cannot be re-run");
            }
            payrollRecordRepository.deleteAllByCompanyIdAndPayrollRunId(companyId, run.getId());
            loanRepaymentRepository.deleteAllByCompanyIdAndPayrollRunId(companyId, run.getId());
            payrollRecordRepository.flush();
            loanRepaymentRepository.flush();
            return run;
        }

        PayrollRun newRun = new PayrollRun();
        newRun.setCompanyId(companyId);
        newRun.setMonth(month);
        newRun.setYear(year);
        newRun.setStatus(PayrollRunStatus.DRAFT);
        newRun.setEmployeeCount(0);
        newRun.setTotalGrossPay(BigDecimal.ZERO);
        newRun.setTotalDeductions(BigDecimal.ZERO);
        newRun.setTotalNetPay(BigDecimal.ZERO);
        newRun.setPreparedBy(currentUserId);
        newRun.setPreparedAt(LocalDateTime.now());
        return payrollRunRepository.save(newRun);
    }

    private Attendance resolveAttendance(Long companyId, Long empId, int month, int year, Map<Long, Attendance> attendanceMap) {
        Attendance att = attendanceMap.get(empId);
        if (att != null) {
            return att;
        }
        Attendance fallback = new Attendance(companyId, empId, month, year, 26,
                new BigDecimal("26.0"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("26.0"),
                com.payrollpro.model.AttendanceSource.MANUAL);
        return attendanceRepository.save(fallback);
    }

    private BigDecimal[] calculateVariablePayAmounts(List<com.payrollpro.model.VariablePayRecord> empVarPays) {
        if (empVarPays == null || empVarPays.isEmpty()) {
            return new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO };
        }
        BigDecimal earnings = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;
        for (com.payrollpro.model.VariablePayRecord vp : empVarPays) {
            if (vp.getAmount() == null) continue;
            if (vp.getType() == com.payrollpro.model.VariablePayType.OVERTIME
                    || vp.getType() == com.payrollpro.model.VariablePayType.BONUS
                    || vp.getType() == com.payrollpro.model.VariablePayType.INCENTIVE) {
                earnings = earnings.add(vp.getAmount());
            } else if (vp.getType() == com.payrollpro.model.VariablePayType.DEDUCTION) {
                deductions = deductions.add(vp.getAmount());
            }
        }
        return new BigDecimal[] { earnings, deductions };
    }

    private void applyTaxAdjustment(Long companyId, Long empId, int month, int year,
                                    SalaryStructure salary, PayrollRecord record) {
        String fy = (month >= 4) ? year + "-" + (year + 1) : (year - 1) + "-" + year;
        Optional<TaxDeclaration> declOpt = taxDeclarationRepository
                .findByCompanyIdAndEmployeeIdAndFinancialYear(companyId, empId, fy);
        if (declOpt.isEmpty()) {
            return;
        }

        TaxDeclaration decl = declOpt.get();
        BigDecimal annualGross = (salary.getMonthlyGross() != null)
                ? salary.getMonthlyGross().multiply(BigDecimal.valueOf(12))
                : salary.getAnnualCTC();
        BigDecimal annualTax = taxDeclarationService.calculateAnnualTax(annualGross, salary.getBasicSalary(), decl);
        BigDecimal monthlyTds = annualTax.divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal oldTds = record.getTdsDeduction() != null ? record.getTdsDeduction() : BigDecimal.ZERO;
        BigDecimal diff = monthlyTds.subtract(oldTds);
        record.setTdsDeduction(monthlyTds);
        record.setTotalDeductions(record.getTotalDeductions().add(diff));
        record.setNetPay(record.getGrossEarned().subtract(record.getTotalDeductions()));
    }

    private void applyLoanDeductions(Long companyId, Long empId, Long payrollRunId, int month, int year,
                                     PayrollRecord record) {
        List<com.payrollpro.model.LoanRecord> activeLoans = loanRecordRepository.findAllByCompanyIdAndEmployeeIdAndStatus(
                companyId, empId, com.payrollpro.model.LoanStatus.ACTIVE);
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
                        companyId, loan.getId(), empId, payrollRunId, emi, month, year);
                loanRepaymentRepository.save(repayment);
            }
        }
    }

    private void applyApprovedReimbursements(Long companyId, Long empId, int month, int year, PayrollRecord record) {
        List<ExpenseClaim> approvedClaims = expenseClaimService.getApprovedClaimsForMonth(companyId, empId, month, year);
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
    }

    private PayrollRunResponse saveAndCompleteRun(PayrollRun run, int count, BigDecimal gross, BigDecimal deductions, BigDecimal net) {
        run.setEmployeeCount(count);
        run.setTotalGrossPay(gross);
        run.setTotalDeductions(deductions);
        run.setTotalNetPay(net);
        run.setStatus(PayrollRunStatus.DRAFT);
        PayrollRun saved = payrollRunRepository.save(run);
        return new PayrollRunResponse(saved);
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

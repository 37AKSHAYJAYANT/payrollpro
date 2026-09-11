package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.PayrollRecordResponse;
import com.payrollpro.dto.PayrollRunResponse;
import com.payrollpro.model.Attendance;
import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.model.PayrollRunStatus;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.model.User;
import com.payrollpro.repository.AttendanceRepository;
import com.payrollpro.repository.EmployeeRepository;
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

    public PayrollService(PayrollRunRepository payrollRunRepository,
                          PayrollRecordRepository payrollRecordRepository,
                          EmployeeRepository employeeRepository,
                          SalaryStructureRepository salaryStructureRepository,
                          AttendanceRepository attendanceRepository,
                          UserRepository userRepository,
                          PayrollCalculationService payrollCalculationService) {
        this.payrollRunRepository = payrollRunRepository;
        this.payrollRecordRepository = payrollRecordRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.payrollCalculationService = payrollCalculationService;
    }

    private Long getRequiredCompanyId() {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        return companyId;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
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

        // Preload salaries and attendances
        Map<Long, SalaryStructure> salaryMap = salaryStructureRepository.findAll().stream()
                .filter(s -> s.getCompanyId().equals(companyId))
                .collect(Collectors.toMap(SalaryStructure::getEmployeeId, s -> s));

        Map<Long, Attendance> attendanceMap = attendanceRepository.findAllByCompanyIdAndYearAndMonth(companyId, year, month).stream()
                .collect(Collectors.toMap(Attendance::getEmployeeId, a -> a));

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

            PayrollRecord record = payrollCalculationService.calculateForEmployee(emp, salary, attendance, payrollRun.getId());
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

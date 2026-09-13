package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.LeaveApprovalRequest;
import com.payrollpro.dto.LeaveBalanceResponse;
import com.payrollpro.dto.LeaveRequestResponse;
import com.payrollpro.dto.LeaveSubmissionRequest;
import com.payrollpro.model.Employee;
import com.payrollpro.model.LeaveBalance;
import com.payrollpro.model.LeaveRequest;
import com.payrollpro.model.LeaveRequestStatus;
import com.payrollpro.model.LeaveType;
import com.payrollpro.model.User;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.LeaveBalanceRepository;
import com.payrollpro.repository.LeaveRequestRepository;
import com.payrollpro.repository.LeaveTypeRepository;
import com.payrollpro.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final LeaveBalanceService leaveBalanceService;

    public LeaveRequestService(LeaveRequestRepository leaveRequestRepository,
                               LeaveBalanceRepository leaveBalanceRepository,
                               LeaveTypeRepository leaveTypeRepository,
                               EmployeeRepository employeeRepository,
                               UserRepository userRepository,
                               LeaveBalanceService leaveBalanceService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.leaveTypeRepository = leaveTypeRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.leaveBalanceService = leaveBalanceService;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    private User getAuthenticatedUser() {
        return com.payrollpro.util.SecurityUtils.getCurrentUser(userRepository);
    }

    private java.util.Optional<Employee> findCurrentEmployee(User user, Long companyId) {
        if (user.getEmployeeId() != null) {
            return employeeRepository.findByCompanyIdAndId(companyId, user.getEmployeeId());
        }
        return employeeRepository.findAllByCompanyId(companyId).stream()
                .filter(e -> e.getEmail().equalsIgnoreCase(user.getEmail()))
                .findFirst();
    }

    private Employee getCurrentEmployee(User user, Long companyId) {
        return findCurrentEmployee(user, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No linked employee profile for user " + user.getEmail()));
    }

    @Transactional
    public LeaveRequestResponse submitLeaveRequest(LeaveSubmissionRequest request) {
        Long companyId = getRequiredCompanyId();
        User user = getAuthenticatedUser();
        Employee employee = getCurrentEmployee(user, companyId);

        if (request.getFromDate().isAfter(request.getToDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "From date cannot be after To date");
        }

        // Check overlapping requests
        if (leaveRequestRepository.existsOverlappingRequest(companyId, employee.getId(), request.getFromDate(), request.getToDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active leave request already exists for the selected date range");
        }

        // Verify leave type exists
        LeaveType leaveType = leaveTypeRepository.findByCompanyIdAndId(companyId, request.getLeaveTypeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave type not found"));

        // Calculate days
        BigDecimal days;
        if (Boolean.TRUE.equals(request.getIsHalfDay())) {
            days = new BigDecimal("0.5");
        } else {
            long businessDays = countBusinessDays(request.getFromDate(), request.getToDate());
            days = BigDecimal.valueOf(businessDays).setScale(1);
        }

        // Check sufficient leave balance
        int year = request.getFromDate().getYear();
        leaveBalanceService.initializeEmployeeBalances(companyId, employee.getId(), year);

        LeaveBalance balance = leaveBalanceRepository.findByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(
                companyId, employee.getId(), leaveType.getId(), year)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave balance record not found"));

        if (balance.getRemaining().compareTo(days) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Insufficient %s balance: Requested %.1f days, but only %.1f remaining",
                            leaveType.getName(), days.doubleValue(), balance.getRemaining().doubleValue()));
        }

        LeaveRequest leaveRequest = new LeaveRequest(
                companyId,
                employee.getId(),
                leaveType.getId(),
                request.getFromDate(),
                request.getToDate(),
                days,
                request.getReason()
        );

        leaveRequest = leaveRequestRepository.save(leaveRequest);
        return mapToResponse(leaveRequest, employee, leaveType);
    }

    public List<LeaveRequestResponse> getMyRequests() {
        Long companyId = getRequiredCompanyId();
        User user = getAuthenticatedUser();
        Employee employee = findCurrentEmployee(user, companyId).orElse(null);
        if (employee == null) {
            return Collections.emptyList();
        }

        List<LeaveRequest> requests = leaveRequestRepository.findAllByCompanyIdAndEmployeeIdOrderByCreatedAtDesc(companyId, employee.getId());
        Map<Long, LeaveType> typeMap = leaveTypeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(LeaveType::getId, t -> t));

        return requests.stream()
                .map(r -> mapToResponse(r, employee, typeMap.get(r.getLeaveTypeId())))
                .collect(Collectors.toList());
    }

    public List<LeaveBalanceResponse> getMyBalances() {
        Long companyId = getRequiredCompanyId();
        User user = getAuthenticatedUser();
        Employee employee = findCurrentEmployee(user, companyId).orElse(null);
        if (employee == null) {
            return Collections.emptyList();
        }

        int currentYear = LocalDate.now().getYear();
        return leaveBalanceService.getMyBalances(companyId, employee.getId(), currentYear);
    }

    public List<LeaveRequestResponse> getPendingRequests() {
        Long companyId = getRequiredCompanyId();
        List<LeaveRequest> pending = leaveRequestRepository.findAllByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, LeaveRequestStatus.PENDING);
        if (pending.isEmpty()) {
            return Collections.emptyList();
        }

        java.util.Set<Long> empIds = pending.stream().map(LeaveRequest::getEmployeeId).collect(Collectors.toSet());
        List<Employee> emps = employeeRepository.findByCompanyIdAndIdIn(companyId, empIds);
        if (emps == null || emps.isEmpty()) {
            emps = employeeRepository.findAllByCompanyId(companyId);
        }
        Map<Long, Employee> empMap = (emps != null ? emps : Collections.<Employee>emptyList()).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e, (e1, e2) -> e1));
        Map<Long, LeaveType> typeMap = leaveTypeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(LeaveType::getId, t -> t));

        return pending.stream()
                .map(r -> mapToResponse(r, empMap.get(r.getEmployeeId()), typeMap.get(r.getLeaveTypeId())))
                .collect(Collectors.toList());
    }

    public List<LeaveRequestResponse> getAllCompanyRequests() {
        Long companyId = getRequiredCompanyId();
        List<LeaveRequest> allRequests = leaveRequestRepository.findAllByCompanyIdOrderByCreatedAtDesc(companyId);
        if (allRequests.isEmpty()) {
            return Collections.emptyList();
        }

        java.util.Set<Long> empIds = allRequests.stream().map(LeaveRequest::getEmployeeId).collect(Collectors.toSet());
        List<Employee> emps = employeeRepository.findByCompanyIdAndIdIn(companyId, empIds);
        if (emps == null || emps.isEmpty()) {
            emps = employeeRepository.findAllByCompanyId(companyId);
        }
        Map<Long, Employee> empMap = (emps != null ? emps : Collections.<Employee>emptyList()).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e, (e1, e2) -> e1));
        Map<Long, LeaveType> typeMap = leaveTypeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(LeaveType::getId, t -> t));

        return allRequests.stream()
                .map(r -> mapToResponse(r, empMap.get(r.getEmployeeId()), typeMap.get(r.getLeaveTypeId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveRequestResponse approveLeave(Long id, LeaveApprovalRequest approvalRequest) {
        Long companyId = getRequiredCompanyId();
        User approver = getAuthenticatedUser();

        LeaveRequest request = leaveRequestRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave request is already " + request.getStatus());
        }

        // Deduct from employee's leave balance
        int year = request.getFromDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(
                companyId, request.getEmployeeId(), request.getLeaveTypeId(), year)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave balance record not found"));

        balance.deduct(request.getDays());
        leaveBalanceRepository.save(balance);

        request.setStatus(LeaveRequestStatus.APPROVED);
        request.setApproverId(approver.getId());
        request.setApprovedAt(LocalDateTime.now());
        if (approvalRequest != null && approvalRequest.getRemarks() != null) {
            request.setRemarks(approvalRequest.getRemarks());
        }

        request = leaveRequestRepository.save(request);

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, request.getEmployeeId()).orElse(null);
        LeaveType type = leaveTypeRepository.findByCompanyIdAndId(companyId, request.getLeaveTypeId()).orElse(null);
        return mapToResponse(request, employee, type);
    }

    @Transactional
    public LeaveRequestResponse rejectLeave(Long id, LeaveApprovalRequest approvalRequest) {
        Long companyId = getRequiredCompanyId();
        User approver = getAuthenticatedUser();

        LeaveRequest request = leaveRequestRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave request is already " + request.getStatus());
        }

        request.setStatus(LeaveRequestStatus.REJECTED);
        request.setApproverId(approver.getId());
        request.setApprovedAt(LocalDateTime.now());
        if (approvalRequest != null && approvalRequest.getRemarks() != null) {
            request.setRemarks(approvalRequest.getRemarks());
        }

        request = leaveRequestRepository.save(request);

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, request.getEmployeeId()).orElse(null);
        LeaveType type = leaveTypeRepository.findByCompanyIdAndId(companyId, request.getLeaveTypeId()).orElse(null);
        return mapToResponse(request, employee, type);
    }

    private long countBusinessDays(LocalDate from, LocalDate to) {
        long count = 0;
        LocalDate curr = from;
        while (!curr.isAfter(to)) {
            DayOfWeek dow = curr.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                count++;
            }
            curr = curr.plusDays(1);
        }
        return Math.max(1, count);
    }

    private LeaveRequestResponse mapToResponse(LeaveRequest r, Employee emp, LeaveType type) {
        LeaveRequestResponse resp = new LeaveRequestResponse();
        resp.setId(r.getId());
        resp.setEmployeeId(r.getEmployeeId());
        resp.setLeaveTypeId(r.getLeaveTypeId());
        resp.setFromDate(r.getFromDate());
        resp.setToDate(r.getToDate());
        resp.setDays(r.getDays());
        resp.setReason(r.getReason());
        resp.setStatus(r.getStatus());
        resp.setApproverId(r.getApproverId());
        resp.setApprovedAt(r.getApprovedAt());
        resp.setRemarks(r.getRemarks());
        resp.setCreatedAt(r.getCreatedAt());

        if (emp != null) {
            resp.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
            resp.setEmpCode(emp.getEmpCode());
            resp.setDepartment(emp.getDepartment());
        }
        if (type != null) {
            resp.setLeaveTypeCode(type.getCode());
            resp.setLeaveTypeName(type.getName());
        }
        return resp;
    }
}

package com.payrollpro.controller;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.LeaveApprovalRequest;
import com.payrollpro.dto.LeaveBalanceResponse;
import com.payrollpro.dto.LeaveRequestResponse;
import com.payrollpro.dto.LeaveSubmissionRequest;
import com.payrollpro.model.LeaveType;
import com.payrollpro.repository.LeaveTypeRepository;
import com.payrollpro.service.LeaveBalanceService;
import com.payrollpro.service.LeaveRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveRequestService leaveRequestService;
    private final LeaveBalanceService leaveBalanceService;
    private final LeaveTypeRepository leaveTypeRepository;

    public LeaveController(LeaveRequestService leaveRequestService,
                           LeaveBalanceService leaveBalanceService,
                           LeaveTypeRepository leaveTypeRepository) {
        this.leaveRequestService = leaveRequestService;
        this.leaveBalanceService = leaveBalanceService;
        this.leaveTypeRepository = leaveTypeRepository;
    }

    @GetMapping("/types")
    public ResponseEntity<List<LeaveType>> getLeaveTypes() {
        Long companyId = TenantContext.getCompanyId();
        List<LeaveType> types = leaveTypeRepository.findAllByCompanyId(companyId);
        if (types.isEmpty()) {
            types = leaveBalanceService.initializeDefaultLeaveTypes(companyId);
        }
        return ResponseEntity.ok(types);
    }

    @PostMapping("/request")
    public ResponseEntity<LeaveRequestResponse> submitLeaveRequest(
            @Valid @RequestBody LeaveSubmissionRequest request) {
        LeaveRequestResponse response = leaveRequestService.submitLeaveRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<LeaveRequestResponse>> getMyRequests() {
        return ResponseEntity.ok(leaveRequestService.getMyRequests());
    }

    @GetMapping("/my-balance")
    public ResponseEntity<List<LeaveBalanceResponse>> getMyBalances() {
        return ResponseEntity.ok(leaveRequestService.getMyBalances());
    }

    @GetMapping("/employee/{employeeId}/balance")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<LeaveBalanceResponse>> getEmployeeBalances(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year) {
        Long companyId = TenantContext.getCompanyId();
        int targetYear = (year != null) ? year : java.time.LocalDate.now().getYear();
        return ResponseEntity.ok(leaveBalanceService.getMyBalances(companyId, employeeId, targetYear));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<LeaveRequestResponse>> getPendingRequests() {
        return ResponseEntity.ok(leaveRequestService.getPendingRequests());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<LeaveRequestResponse>> getAllCompanyRequests() {
        return ResponseEntity.ok(leaveRequestService.getAllCompanyRequests());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<LeaveRequestResponse> approveLeave(
            @PathVariable Long id,
            @RequestBody(required = false) LeaveApprovalRequest request) {
        return ResponseEntity.ok(leaveRequestService.approveLeave(id, request));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<LeaveRequestResponse> rejectLeave(
            @PathVariable Long id,
            @RequestBody(required = false) LeaveApprovalRequest request) {
        return ResponseEntity.ok(leaveRequestService.rejectLeave(id, request));
    }
}

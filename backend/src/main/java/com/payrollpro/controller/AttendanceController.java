package com.payrollpro.controller;

import com.payrollpro.dto.AttendanceRequest;
import com.payrollpro.dto.AttendanceResponse;
import com.payrollpro.dto.AttendanceUploadSummary;
import com.payrollpro.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AttendanceResponse> recordAttendance(@Valid @RequestBody AttendanceRequest request) {
        AttendanceResponse response = attendanceService.recordAttendance(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceForMonth(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(attendanceService.getAttendanceForMonth(month, year));
    }

    @PostMapping({"/upload-csv", "/bulk-upload"})
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AttendanceUploadSummary> uploadCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam int month,
            @RequestParam int year) {
        AttendanceUploadSummary summary = attendanceService.uploadCsv(file, month, year);
        return ResponseEntity.ok(summary);
    }
}

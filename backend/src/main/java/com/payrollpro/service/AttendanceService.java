package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.AttendanceRequest;
import com.payrollpro.dto.AttendanceResponse;
import com.payrollpro.dto.AttendanceUploadSummary;
import com.payrollpro.model.Attendance;
import com.payrollpro.model.AttendanceSource;
import com.payrollpro.model.Employee;
import com.payrollpro.repository.AttendanceRepository;
import com.payrollpro.repository.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    @Transactional
    public AttendanceResponse recordAttendance(AttendanceRequest request) {
        Long companyId = getRequiredCompanyId();

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, request.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        BigDecimal totalWorking = BigDecimal.valueOf(request.getTotalWorkingDays());
        BigDecimal unpaid = request.getUnpaidLeaveDays() != null ? request.getUnpaidLeaveDays() : BigDecimal.ZERO;
        BigDecimal payableDays = totalWorking.subtract(unpaid);
        if (payableDays.compareTo(BigDecimal.ZERO) < 0) {
            payableDays = BigDecimal.ZERO;
        }

        Attendance attendance = attendanceRepository
                .findByCompanyIdAndEmployeeIdAndYearAndMonth(companyId, employee.getId(), request.getYear(), request.getMonth())
                .orElseGet(() -> {
                    Attendance att = new Attendance();
                    att.setCompanyId(companyId);
                    att.setEmployeeId(employee.getId());
                    att.setMonth(request.getMonth());
                    att.setYear(request.getYear());
                    return att;
                });

        attendance.setTotalWorkingDays(request.getTotalWorkingDays());
        attendance.setPresentDays(request.getPresentDays());
        attendance.setPaidLeaveDays(request.getPaidLeaveDays() != null ? request.getPaidLeaveDays() : BigDecimal.ZERO);
        attendance.setUnpaidLeaveDays(unpaid);
        attendance.setPayableDays(payableDays);
        attendance.setSource(AttendanceSource.MANUAL);

        attendance = attendanceRepository.save(attendance);
        return mapToResponse(attendance, employee);
    }

    public List<AttendanceResponse> getAttendanceForMonth(int month, int year) {
        Long companyId = getRequiredCompanyId();
        List<Attendance> attendances = attendanceRepository.findAllByCompanyIdAndYearAndMonth(companyId, year, month);

        Map<Long, Employee> empMap = employeeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        return attendances.stream()
                .map(a -> mapToResponse(a, empMap.get(a.getEmployeeId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceUploadSummary uploadCsv(MultipartFile file, int month, int year) {
        Long companyId = getRequiredCompanyId();

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CSV file is empty or missing");
        }

        int processed = 0;
        int errors = 0;
        List<String> errorDetails = new ArrayList<>();

        Map<String, Employee> empCodeMap = employeeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(e -> e.getEmpCode().toUpperCase(), e -> e));

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                // Skip header line
                if (lineNumber == 1 && (trimmed.toLowerCase().contains("empcode") || trimmed.toLowerCase().contains("employee"))) {
                    continue;
                }

                String[] parts = trimmed.split(",");
                if (parts.length < 5) {
                    errors++;
                    errorDetails.add("Line " + lineNumber + ": Insufficient columns");
                    continue;
                }

                try {
                    String empCode = parts[0].trim().toUpperCase();
                    Employee emp = empCodeMap.get(empCode);
                    if (emp == null) {
                        errors++;
                        errorDetails.add("Line " + lineNumber + ": Employee with code '" + empCode + "' not found in company");
                        continue;
                    }

                    int totalWorkingDays;
                    BigDecimal presentDays;
                    BigDecimal paidLeaves;
                    BigDecimal unpaidLeaves;

                    if (parts.length >= 7) {
                        // Format: empCode, month, year, totalWorkingDays, presentDays, paidLeaveDays, unpaidLeaveDays
                        totalWorkingDays = Integer.parseInt(parts[3].trim());
                        presentDays = new BigDecimal(parts[4].trim());
                        paidLeaves = new BigDecimal(parts[5].trim());
                        unpaidLeaves = new BigDecimal(parts[6].trim());
                    } else {
                        // Format: empCode, totalWorkingDays, presentDays, paidLeaveDays, unpaidLeaveDays
                        totalWorkingDays = Integer.parseInt(parts[1].trim());
                        presentDays = new BigDecimal(parts[2].trim());
                        paidLeaves = new BigDecimal(parts[3].trim());
                        unpaidLeaves = new BigDecimal(parts[4].trim());
                    }

                    BigDecimal payableDays = BigDecimal.valueOf(totalWorkingDays).subtract(unpaidLeaves);
                    if (payableDays.compareTo(BigDecimal.ZERO) < 0) {
                        payableDays = BigDecimal.ZERO;
                    }

                    Attendance attendance = attendanceRepository
                            .findByCompanyIdAndEmployeeIdAndYearAndMonth(companyId, emp.getId(), year, month)
                            .orElseGet(() -> {
                                Attendance a = new Attendance();
                                a.setCompanyId(companyId);
                                a.setEmployeeId(emp.getId());
                                a.setMonth(month);
                                a.setYear(year);
                                return a;
                            });

                    attendance.setTotalWorkingDays(totalWorkingDays);
                    attendance.setPresentDays(presentDays);
                    attendance.setPaidLeaveDays(paidLeaves);
                    attendance.setUnpaidLeaveDays(unpaidLeaves);
                    attendance.setPayableDays(payableDays);
                    attendance.setSource(AttendanceSource.CSV_UPLOAD);

                    attendanceRepository.save(attendance);
                    processed++;

                } catch (Exception ex) {
                    errors++;
                    errorDetails.add("Line " + lineNumber + ": Error parsing row — " + ex.getMessage());
                }
            }

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read CSV file: " + e.getMessage());
        }

        return new AttendanceUploadSummary(processed, errors, errorDetails);
    }

    private AttendanceResponse mapToResponse(Attendance a, Employee emp) {
        AttendanceResponse resp = new AttendanceResponse();
        resp.setId(a.getId());
        resp.setEmployeeId(a.getEmployeeId());
        resp.setMonth(a.getMonth());
        resp.setYear(a.getYear());
        resp.setTotalWorkingDays(a.getTotalWorkingDays());
        resp.setPresentDays(a.getPresentDays());
        resp.setPaidLeaveDays(a.getPaidLeaveDays());
        resp.setUnpaidLeaveDays(a.getUnpaidLeaveDays());
        resp.setPayableDays(a.getPayableDays());
        resp.setSource(a.getSource());

        if (emp != null) {
            resp.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
            resp.setEmpCode(emp.getEmpCode());
            resp.setDepartment(emp.getDepartment());
        }
        return resp;
    }
}

package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.EmployeeRequest;
import com.payrollpro.dto.EmployeeResponse;
import com.payrollpro.dto.PageResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import com.payrollpro.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceService leaveBalanceService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           LeaveBalanceService leaveBalanceService) {
        this.employeeRepository = employeeRepository;
        this.leaveBalanceService = leaveBalanceService;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    public PageResponse<EmployeeResponse> getEmployees(int page, int size, String search) {
        return getEmployees(page, size, search, null, null);
    }

    public PageResponse<EmployeeResponse> getEmployees(int page, int size, String search, String department, String status) {
        Long companyId = getRequiredCompanyId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "empCode"));

        EmployeeStatus employeeStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                employeeStatus = EmployeeStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        String deptFilter = (department != null && !department.trim().isEmpty() && !department.equalsIgnoreCase("ALL"))
                ? department.trim() : null;

        String searchFilter = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Employee> employeePage;
        if (searchFilter != null || deptFilter != null || employeeStatus != null) {
            employeePage = employeeRepository.filterEmployees(companyId, searchFilter, deptFilter, employeeStatus, pageable);
        } else {
            employeePage = employeeRepository.findAllByCompanyId(companyId, pageable);
        }

        List<EmployeeResponse> content = employeePage.getContent().stream()
                .map(EmployeeResponse::new)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                employeePage.getNumber(),
                employeePage.getSize(),
                employeePage.getTotalElements(),
                employeePage.getTotalPages(),
                employeePage.isLast()
        );
    }

    public List<String> getDistinctDepartments() {
        Long companyId = getRequiredCompanyId();
        return employeeRepository.findDistinctDepartmentsByCompanyId(companyId);
    }

    public EmployeeResponse getEmployeeById(Long id) {
        Long companyId = getRequiredCompanyId();
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        return new EmployeeResponse(employee);
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        Long companyId = getRequiredCompanyId();

        if (employeeRepository.existsByCompanyIdAndEmail(companyId, request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee with email " + request.getEmail() + " already exists");
        }

        // Auto-generate empCode
        String empCode = generateNextEmpCode(companyId);

        Employee employee = new Employee();
        employee.setCompanyId(companyId);
        employee.setEmpCode(empCode);
        applyRequestToEmployee(request, employee);
        employee.setStatus(EmployeeStatus.ACTIVE);

        employee = employeeRepository.save(employee);

        // Auto-create LeaveBalance records for current year
        leaveBalanceService.initializeEmployeeBalances(companyId, employee.getId(), LocalDate.now().getYear());

        return new EmployeeResponse(employee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Long companyId = getRequiredCompanyId();
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // If email is changing, verify no duplicate
        if (!employee.getEmail().equalsIgnoreCase(request.getEmail()) &&
                employeeRepository.existsByCompanyIdAndEmail(companyId, request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee with email " + request.getEmail() + " already exists");
        }

        applyRequestToEmployee(request, employee);
        employee = employeeRepository.save(employee);
        return new EmployeeResponse(employee);
    }

    @Transactional
    public EmployeeResponse deleteEmployee(Long id) {
        Long companyId = getRequiredCompanyId();
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Soft delete: set status to EXITED and dateOfExit
        employee.setStatus(EmployeeStatus.EXITED);
        employee.setDateOfExit(LocalDate.now());

        employee = employeeRepository.save(employee);
        return new EmployeeResponse(employee);
    }

    private String generateNextEmpCode(Long companyId) {
        long count = employeeRepository.countByCompanyId(companyId);
        long candidate = count + 1;
        String code = String.format("EMP-%03d", candidate);

        while (employeeRepository.existsByCompanyIdAndEmpCode(companyId, code)) {
            candidate++;
            code = String.format("EMP-%03d", candidate);
        }
        return code;
    }

    private void applyRequestToEmployee(EmployeeRequest req, Employee emp) {
        emp.setFirstName(req.getFirstName());
        emp.setLastName(req.getLastName());
        emp.setEmail(req.getEmail());
        emp.setPhone(req.getPhone());
        emp.setDepartment(req.getDepartment());
        emp.setDesignation(req.getDesignation());
        emp.setDateOfJoining(req.getDateOfJoining());
        emp.setDateOfBirth(req.getDateOfBirth());
        emp.setPanNumber(req.getPanNumber());
        emp.setAadhaarNumber(req.getAadhaarNumber());
        emp.setBankAccountNumber(req.getBankAccountNumber());
        emp.setIfscCode(req.getIfscCode());
        emp.setBankName(req.getBankName());
        if (req.getStatus() != null) {
            emp.setStatus(req.getStatus());
        }
    }
}

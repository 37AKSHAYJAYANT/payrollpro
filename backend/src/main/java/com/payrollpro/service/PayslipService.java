package com.payrollpro.service;

import com.payrollpro.dto.PayrollRecordResponse;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.Role;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.model.User;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import com.payrollpro.repository.UserRepository;
import com.payrollpro.config.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PayslipService {

    private final PayrollRecordRepository payrollRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PayslipPdfService payslipPdfService;

    public PayslipService(PayrollRecordRepository payrollRecordRepository,
                          EmployeeRepository employeeRepository,
                          SalaryStructureRepository salaryStructureRepository,
                          CompanyRepository companyRepository,
                          UserRepository userRepository,
                          PayslipPdfService payslipPdfService) {
        this.payrollRecordRepository = payrollRecordRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.payslipPdfService = payslipPdfService;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    private User getAuthenticatedUser() {
        return com.payrollpro.util.SecurityUtils.getCurrentUser(userRepository);
    }

    public byte[] generatePayslipPdf(Long recordId) {
        Long companyId = getRequiredCompanyId();
        User currentUser = getAuthenticatedUser();

        PayrollRecord record = payrollRecordRepository.findByCompanyIdAndId(companyId, recordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll record not found"));

        // Role-based authorization: Employees may only download their own payslips
        if (currentUser.getRole() == Role.EMPLOYEE) {
            if (currentUser.getEmployeeId() == null || !currentUser.getEmployeeId().equals(record.getEmployeeId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You can only view your own payslips");
            }
        }

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, record.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        SalaryStructure salary = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, record.getEmployeeId())
                .orElse(null);

        Company company = companyRepository.findById(companyId).orElse(null);

        return payslipPdfService.generatePayslipPdf(record, employee, salary, company);
    }

    public List<PayrollRecordResponse> getMyPayslips() {
        Long companyId = getRequiredCompanyId();
        User currentUser = getAuthenticatedUser();

        if (currentUser.getEmployeeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not linked to an employee profile");
        }

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, currentUser.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee profile not found"));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndEmployeeIdOrderByYearDescMonthDesc(
                companyId, currentUser.getEmployeeId());

        return records.stream()
                .map(r -> new PayrollRecordResponse(r, employee))
                .collect(Collectors.toList());
    }

    public List<PayrollRecordResponse> getPayslipsForEmployee(Long employeeId) {
        Long companyId = getRequiredCompanyId();

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndEmployeeIdOrderByYearDescMonthDesc(
                companyId, employeeId);

        return records.stream()
                .map(r -> new PayrollRecordResponse(r, employee))
                .collect(Collectors.toList());
    }
}

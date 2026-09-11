package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.SalaryStructureRequest;
import com.payrollpro.dto.SalaryStructureResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class SalaryStructureService {

    private final SalaryStructureRepository salaryStructureRepository;
    private final EmployeeRepository employeeRepository;

    public SalaryStructureService(SalaryStructureRepository salaryStructureRepository,
                                  EmployeeRepository employeeRepository) {
        this.salaryStructureRepository = salaryStructureRepository;
        this.employeeRepository = employeeRepository;
    }

    private Long getRequiredCompanyId() {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        return companyId;
    }

    public SalaryStructureResponse getSalaryStructure(Long employeeId) {
        Long companyId = getRequiredCompanyId();

        // Verify employee exists and belongs to tenant
        employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        SalaryStructure salaryStructure = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salary structure not configured for this employee"));

        return new SalaryStructureResponse(salaryStructure);
    }

    @Transactional
    public SalaryStructureResponse createOrUpdateSalaryStructure(Long employeeId, SalaryStructureRequest request) {
        Long companyId = getRequiredCompanyId();

        // Verify employee exists and belongs to tenant
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Compute salary breakdown
        BigDecimal annualCTC = request.getAnnualCTC().setScale(2, RoundingMode.HALF_UP);
        BigDecimal monthlyGross = annualCTC.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal basicSalary = monthlyGross.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal hra = basicSalary.multiply(new BigDecimal("0.40")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal specialAllowance = monthlyGross.subtract(basicSalary).subtract(hra).setScale(2, RoundingMode.HALF_UP);
        BigDecimal epfEmployee = basicSalary.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal epfEmployer = basicSalary.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal professionalTax = request.getProfessionalTax() != null
                ? request.getProfessionalTax().setScale(2, RoundingMode.HALF_UP)
                : new BigDecimal("200.00");
        BigDecimal monthlyTds = request.getMonthlyTds() != null
                ? request.getMonthlyTds().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        LocalDate effectiveFrom = request.getEffectiveFrom() != null
                ? request.getEffectiveFrom()
                : LocalDate.now();

        SalaryStructure salaryStructure = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, employeeId)
                .orElseGet(() -> {
                    SalaryStructure s = new SalaryStructure();
                    s.setCompanyId(companyId);
                    s.setEmployeeId(employee.getId());
                    return s;
                });

        salaryStructure.setAnnualCTC(annualCTC);
        salaryStructure.setMonthlyGross(monthlyGross);
        salaryStructure.setBasicSalary(basicSalary);
        salaryStructure.setHra(hra);
        salaryStructure.setSpecialAllowance(specialAllowance);
        salaryStructure.setEpfEmployee(epfEmployee);
        salaryStructure.setEpfEmployer(epfEmployer);
        salaryStructure.setProfessionalTax(professionalTax);
        salaryStructure.setMonthlyTds(monthlyTds);
        salaryStructure.setEffectiveFrom(effectiveFrom);

        salaryStructure = salaryStructureRepository.save(salaryStructure);
        return new SalaryStructureResponse(salaryStructure);
    }
}

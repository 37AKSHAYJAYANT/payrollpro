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

@Service
public class SalaryStructureService {

    private final SalaryStructureRepository salaryStructureRepository;
    private final EmployeeRepository employeeRepository;
    private final StatutoryRuleEngine statutoryRuleEngine;

    public SalaryStructureService(SalaryStructureRepository salaryStructureRepository,
                                  EmployeeRepository employeeRepository,
                                  StatutoryRuleEngine statutoryRuleEngine) {
        this.salaryStructureRepository = salaryStructureRepository;
        this.employeeRepository = employeeRepository;
        this.statutoryRuleEngine = statutoryRuleEngine;
    }

    public SalaryStructureResponse getSalaryStructure(Long employeeId) {
        Long companyId = TenantContext.getRequiredCompanyId();

        // Verify employee exists and belongs to tenant
        employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        SalaryStructure salaryStructure = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salary structure not configured for this employee"));

        return new SalaryStructureResponse(salaryStructure);
    }

    public SalaryStructureResponse previewSalaryStructure(BigDecimal annualCTC) {
        SalaryStructure computed = statutoryRuleEngine.computeSalaryStructure(annualCTC, null, null, null);
        return new SalaryStructureResponse(computed);
    }

    @Transactional
    public SalaryStructureResponse createOrUpdateSalaryStructure(Long employeeId, SalaryStructureRequest request) {
        Long companyId = TenantContext.getRequiredCompanyId();

        // Verify employee exists and belongs to tenant
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Compute salary breakdown using centralized rule engine
        SalaryStructure computed = statutoryRuleEngine.computeSalaryStructure(
                request.getAnnualCTC(),
                request.getProfessionalTax(),
                request.getMonthlyTds(),
                request.getEffectiveFrom()
        );

        SalaryStructure salaryStructure = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, employeeId)
                .orElseGet(() -> {
                    SalaryStructure s = new SalaryStructure();
                    s.setCompanyId(companyId);
                    s.setEmployeeId(employee.getId());
                    return s;
                });

        salaryStructure.setAnnualCTC(computed.getAnnualCTC());
        salaryStructure.setMonthlyGross(computed.getMonthlyGross());
        salaryStructure.setBasicSalary(computed.getBasicSalary());
        salaryStructure.setHra(computed.getHra());
        salaryStructure.setSpecialAllowance(computed.getSpecialAllowance());
        salaryStructure.setEpfEmployee(computed.getEpfEmployee());
        salaryStructure.setEpfEmployer(computed.getEpfEmployer());
        salaryStructure.setProfessionalTax(computed.getProfessionalTax());
        salaryStructure.setMonthlyTds(computed.getMonthlyTds());
        salaryStructure.setEffectiveFrom(computed.getEffectiveFrom());

        salaryStructure = salaryStructureRepository.save(salaryStructure);
        return new SalaryStructureResponse(salaryStructure);
    }
}

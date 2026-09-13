package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.TaxDeclarationRequest;
import com.payrollpro.dto.TaxDeclarationResponse;
import com.payrollpro.model.*;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import com.payrollpro.repository.TaxDeclarationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TaxDeclarationService {

    private static final BigDecimal STANDARD_DEDUCTION_NEW = new BigDecimal("75000.00");
    private static final BigDecimal STANDARD_DEDUCTION_OLD = new BigDecimal("50000.00");
    private static final BigDecimal MAX_80C = new BigDecimal("150000.00");
    private static final BigDecimal MAX_80D = new BigDecimal("75000.00");
    private static final BigDecimal MAX_SEC24 = new BigDecimal("200000.00");
    private static final BigDecimal HEALTH_EDU_CESS = new BigDecimal("1.04");

    private final TaxDeclarationRepository taxDeclarationRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;

    public TaxDeclarationService(TaxDeclarationRepository taxDeclarationRepository,
                                 EmployeeRepository employeeRepository,
                                 SalaryStructureRepository salaryStructureRepository) {
        this.taxDeclarationRepository = taxDeclarationRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    /**
     * Submit or update employee tax declaration for the financial year.
     */
    public TaxDeclarationResponse saveOrUpdateDeclaration(Long employeeId, TaxDeclarationRequest req) {
        Long companyId = getRequiredCompanyId();
        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        String fy = (req.getFinancialYear() != null && !req.getFinancialYear().isBlank())
                ? req.getFinancialYear()
                : "2026-2027";

        TaxDeclaration decl = taxDeclarationRepository
                .findByCompanyIdAndEmployeeIdAndFinancialYear(companyId, employeeId, fy)
                .orElse(new TaxDeclaration());

        decl.setCompanyId(companyId);
        decl.setEmployeeId(employeeId);
        decl.setFinancialYear(fy);
        decl.setRegime(req.getRegime() != null ? req.getRegime() : TaxRegime.NEW_REGIME);

        // Cap deductions to legal thresholds
        decl.setSection80C(req.getSection80C() != null ? req.getSection80C().min(MAX_80C) : BigDecimal.ZERO);
        decl.setSection80D(req.getSection80D() != null ? req.getSection80D().min(MAX_80D) : BigDecimal.ZERO);
        decl.setSection24HomeLoan(req.getSection24HomeLoan() != null ? req.getSection24HomeLoan().min(MAX_SEC24) : BigDecimal.ZERO);
        decl.setAnnualRentPaid(req.getAnnualRentPaid() != null ? req.getAnnualRentPaid() : BigDecimal.ZERO);
        decl.setIsMetro(req.getIsMetro() != null ? req.getIsMetro() : true);
        decl.setOtherExemptions(req.getOtherExemptions() != null ? req.getOtherExemptions() : BigDecimal.ZERO);
        decl.setStatus(TaxDeclarationStatus.SUBMITTED);

        TaxDeclaration saved = taxDeclarationRepository.save(decl);
        return mapToResponse(saved, emp);
    }

    public TaxDeclarationResponse getDeclaration(Long employeeId, String financialYear) {
        Long companyId = getRequiredCompanyId();
        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        String fy = (financialYear != null && !financialYear.isBlank()) ? financialYear : "2026-2027";

        TaxDeclaration decl = taxDeclarationRepository
                .findByCompanyIdAndEmployeeIdAndFinancialYear(companyId, employeeId, fy)
                .orElseGet(() -> {
                    TaxDeclaration def = new TaxDeclaration();
                    def.setCompanyId(companyId);
                    def.setEmployeeId(employeeId);
                    def.setFinancialYear(fy);
                    def.setRegime(TaxRegime.NEW_REGIME);
                    def.setStatus(TaxDeclarationStatus.DRAFT);
                    return def;
                });

        return mapToResponse(decl, emp);
    }

    public List<TaxDeclarationResponse> getAllPendingDeclarations() {
        Long companyId = getRequiredCompanyId();
        List<TaxDeclaration> decls = taxDeclarationRepository.findAllByCompanyIdAndStatus(companyId, TaxDeclarationStatus.SUBMITTED);
        if (decls.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        java.util.Set<Long> empIds = decls.stream().map(TaxDeclaration::getEmployeeId).collect(Collectors.toSet());
        java.util.Map<Long, Employee> empMap = employeeRepository.findByCompanyIdAndIdIn(companyId, empIds).stream()
                .collect(Collectors.toMap(Employee::getId, java.util.function.Function.identity()));

        return decls.stream()
                .map(d -> {
                    Employee emp = empMap.get(d.getEmployeeId());
                    if (emp == null) {
                        emp = employeeRepository.findByCompanyIdAndId(companyId, d.getEmployeeId()).orElse(null);
                    }
                    return mapToResponse(d, emp);
                })
                .collect(Collectors.toList());
    }

    public TaxDeclarationResponse verifyDeclaration(Long id, TaxDeclarationStatus status, String remarks) {
        Long companyId = getRequiredCompanyId();
        TaxDeclaration decl = taxDeclarationRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Declaration not found"));

        decl.setStatus(status);
        decl.setAdminRemarks(remarks);
        TaxDeclaration updated = taxDeclarationRepository.save(decl);

        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, updated.getEmployeeId()).orElse(null);
        return mapToResponse(updated, emp);
    }

    /**
     * Compute dynamic TDS and projected annual tax liability based on regime and deductions.
     */
    public BigDecimal calculateAnnualTax(BigDecimal annualGross, BigDecimal basicSalary, TaxDeclaration decl) {
        if (annualGross == null || annualGross.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        TaxRegime regime = decl != null && decl.getRegime() != null ? decl.getRegime() : TaxRegime.NEW_REGIME;

        if (regime == TaxRegime.NEW_REGIME) {
            // New Regime (Sec 115BAC): Standard deduction ₹75,000, zero chapter VI-A deductions
            BigDecimal taxable = annualGross.subtract(STANDARD_DEDUCTION_NEW).max(BigDecimal.ZERO);
            BigDecimal tax = computeNewRegimeTax(taxable);
            return tax.multiply(HEALTH_EDU_CESS).setScale(2, RoundingMode.HALF_UP);
        } else {
            // Old Regime: Standard deduction ₹50,000 + 80C + 80D + Sec 24 + HRA exemption
            BigDecimal totalDeductions = STANDARD_DEDUCTION_OLD;

            if (decl != null) {
                totalDeductions = totalDeductions.add(decl.getSection80C() != null ? decl.getSection80C() : BigDecimal.ZERO);
                totalDeductions = totalDeductions.add(decl.getSection80D() != null ? decl.getSection80D() : BigDecimal.ZERO);
                totalDeductions = totalDeductions.add(decl.getSection24HomeLoan() != null ? decl.getSection24HomeLoan() : BigDecimal.ZERO);
                totalDeductions = totalDeductions.add(decl.getOtherExemptions() != null ? decl.getOtherExemptions() : BigDecimal.ZERO);

                // Section 10(13A) HRA Exemption:
                // min of: 1) Actual HRA received, 2) 50% basic (metro) or 40% (non-metro), 3) Rent paid - 10% basic
                if (decl.getAnnualRentPaid() != null && decl.getAnnualRentPaid().compareTo(BigDecimal.ZERO) > 0 && basicSalary != null) {
                    BigDecimal annualBasic = basicSalary.multiply(BigDecimal.valueOf(12));
                    BigDecimal tenPercentBasic = annualBasic.multiply(new BigDecimal("0.10"));
                    BigDecimal rentMinusTenPct = decl.getAnnualRentPaid().subtract(tenPercentBasic).max(BigDecimal.ZERO);
                    BigDecimal pctBasic = annualBasic.multiply(decl.getIsMetro() ? new BigDecimal("0.50") : new BigDecimal("0.40"));
                    BigDecimal hraExemption = rentMinusTenPct.min(pctBasic);
                    totalDeductions = totalDeductions.add(hraExemption);
                }
            }

            BigDecimal taxable = annualGross.subtract(totalDeductions).max(BigDecimal.ZERO);
            BigDecimal tax = computeOldRegimeTax(taxable);
            return tax.multiply(HEALTH_EDU_CESS).setScale(2, RoundingMode.HALF_UP);
        }
    }

    private BigDecimal computeNewRegimeTax(BigDecimal taxable) {
        // Section 87A rebate: zero tax if taxable income <= ₹7,00,000
        if (taxable.compareTo(new BigDecimal("700000.00")) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal tax = BigDecimal.ZERO;
        // 0 - 3L : 0%
        // 3L - 6L: 5% (max 15,000)
        // 6L - 9L: 10% (max 30,000)
        // 9L - 12L: 15% (max 45,000)
        // 12L - 15L: 20% (max 60,000)
        // Above 15L: 30%
        BigDecimal rem = taxable;

        if (rem.compareTo(new BigDecimal("300000.00")) > 0) {
            BigDecimal slab = rem.min(new BigDecimal("600000.00")).subtract(new BigDecimal("300000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.05")));
        }
        if (rem.compareTo(new BigDecimal("600000.00")) > 0) {
            BigDecimal slab = rem.min(new BigDecimal("900000.00")).subtract(new BigDecimal("600000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.10")));
        }
        if (rem.compareTo(new BigDecimal("900000.00")) > 0) {
            BigDecimal slab = rem.min(new BigDecimal("1200000.00")).subtract(new BigDecimal("900000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.15")));
        }
        if (rem.compareTo(new BigDecimal("1200000.00")) > 0) {
            BigDecimal slab = rem.min(new BigDecimal("1500000.00")).subtract(new BigDecimal("1200000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.20")));
        }
        if (rem.compareTo(new BigDecimal("1500000.00")) > 0) {
            BigDecimal slab = rem.subtract(new BigDecimal("1500000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.30")));
        }

        return tax;
    }

    private BigDecimal computeOldRegimeTax(BigDecimal taxable) {
        // Section 87A rebate: zero tax if taxable income <= ₹5,00,000
        if (taxable.compareTo(new BigDecimal("500000.00")) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal tax = BigDecimal.ZERO;
        // 0 - 2.5L: 0%
        // 2.5L - 5L: 5% (max 12,500)
        // 5L - 10L: 20% (max 1,00,000)
        // Above 10L: 30%
        BigDecimal rem = taxable;

        if (rem.compareTo(new BigDecimal("250000.00")) > 0) {
            BigDecimal slab = rem.min(new BigDecimal("500000.00")).subtract(new BigDecimal("250000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.05")));
        }
        if (rem.compareTo(new BigDecimal("500000.00")) > 0) {
            BigDecimal slab = rem.min(new BigDecimal("1000000.00")).subtract(new BigDecimal("500000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.20")));
        }
        if (rem.compareTo(new BigDecimal("1000000.00")) > 0) {
            BigDecimal slab = rem.subtract(new BigDecimal("1000000.00"));
            tax = tax.add(slab.multiply(new BigDecimal("0.30")));
        }

        return tax;
    }

    private TaxDeclarationResponse mapToResponse(TaxDeclaration decl, Employee emp) {
        TaxDeclarationResponse res = new TaxDeclarationResponse();
        res.setId(decl.getId());
        res.setEmployeeId(decl.getEmployeeId());
        res.setFinancialYear(decl.getFinancialYear());
        res.setRegime(decl.getRegime());
        res.setSection80C(decl.getSection80C());
        res.setSection80D(decl.getSection80D());
        res.setSection24HomeLoan(decl.getSection24HomeLoan());
        res.setAnnualRentPaid(decl.getAnnualRentPaid());
        res.setIsMetro(decl.getIsMetro());
        res.setOtherExemptions(decl.getOtherExemptions());
        res.setStatus(decl.getStatus());
        res.setAdminRemarks(decl.getAdminRemarks());
        res.setUpdatedAt(decl.getUpdatedAt());

        if (emp != null) {
            res.setEmployeeName((emp.getFirstName() + " " + emp.getLastName()).trim());
            res.setEmpCode(emp.getEmpCode());

            // Fetch salary to compute projected taxes
            Optional<SalaryStructure> salOpt = salaryStructureRepository.findByCompanyIdAndEmployeeId(emp.getCompanyId(), emp.getId());
            if (salOpt.isPresent()) {
                SalaryStructure sal = salOpt.get();
                BigDecimal annualGross = sal.getMonthlyGross() != null ? sal.getMonthlyGross().multiply(BigDecimal.valueOf(12)) : sal.getAnnualCTC();
                BigDecimal projectedTax = calculateAnnualTax(annualGross, sal.getBasicSalary(), decl);
                res.setProjectedAnnualTax(projectedTax);
                res.setMonthlyTds(projectedTax.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP));
            }
        }

        return res;
    }
}

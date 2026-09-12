package com.payrollpro.repository;

import com.payrollpro.model.TaxDeclaration;
import com.payrollpro.model.TaxDeclarationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxDeclarationRepository extends JpaRepository<TaxDeclaration, Long> {

    Optional<TaxDeclaration> findByCompanyIdAndId(Long companyId, Long id);

    Optional<TaxDeclaration> findByCompanyIdAndEmployeeIdAndFinancialYear(
            Long companyId, Long employeeId, String financialYear);

    List<TaxDeclaration> findAllByCompanyIdAndEmployeeIdOrderByFinancialYearDesc(
            Long companyId, Long employeeId);

    List<TaxDeclaration> findAllByCompanyIdAndStatus(Long companyId, TaxDeclarationStatus status);

    List<TaxDeclaration> findAllByCompanyIdAndFinancialYear(Long companyId, String financialYear);
}

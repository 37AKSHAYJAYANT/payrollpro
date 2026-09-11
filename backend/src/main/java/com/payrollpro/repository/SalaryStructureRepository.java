package com.payrollpro.repository;

import com.payrollpro.model.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {

    Optional<SalaryStructure> findByCompanyIdAndEmployeeId(Long companyId, Long employeeId);

    void deleteByCompanyIdAndEmployeeId(Long companyId, Long employeeId);
}

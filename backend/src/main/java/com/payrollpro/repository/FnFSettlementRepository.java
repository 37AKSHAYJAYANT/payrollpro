package com.payrollpro.repository;

import com.payrollpro.model.FnFSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FnFSettlementRepository extends JpaRepository<FnFSettlement, Long> {

    List<FnFSettlement> findAllByCompanyId(Long companyId);

    Optional<FnFSettlement> findByCompanyIdAndId(Long companyId, Long id);

    Optional<FnFSettlement> findByCompanyIdAndEmployeeId(Long companyId, Long employeeId);

    boolean existsByCompanyIdAndEmployeeId(Long companyId, Long employeeId);
}

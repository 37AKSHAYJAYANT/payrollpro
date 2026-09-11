package com.payrollpro.repository;

import com.payrollpro.model.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {

    Optional<PayrollRun> findByCompanyIdAndYearAndMonth(Long companyId, Integer year, Integer month);

    List<PayrollRun> findAllByCompanyIdOrderByYearDescMonthDesc(Long companyId);

    Optional<PayrollRun> findByCompanyIdAndId(Long companyId, Long id);

    boolean existsByCompanyIdAndYearAndMonth(Long companyId, Integer year, Integer month);
}

package com.payrollpro.repository;

import com.payrollpro.model.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, Long> {

    Optional<PayrollRecord> findByCompanyIdAndId(Long companyId, Long id);

    List<PayrollRecord> findAllByCompanyIdAndPayrollRunId(Long companyId, Long payrollRunId);

    List<PayrollRecord> findAllByCompanyIdAndEmployeeIdOrderByYearDescMonthDesc(Long companyId, Long employeeId);

    Optional<PayrollRecord> findByCompanyIdAndEmployeeIdAndYearAndMonth(
            Long companyId, Long employeeId, Integer year, Integer month);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("DELETE FROM PayrollRecord r WHERE r.companyId = :companyId AND r.payrollRunId = :payrollRunId")
    void deleteAllByCompanyIdAndPayrollRunId(@org.springframework.data.repository.query.Param("companyId") Long companyId, @org.springframework.data.repository.query.Param("payrollRunId") Long payrollRunId);
}

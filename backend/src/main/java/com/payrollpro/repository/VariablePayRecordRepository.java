package com.payrollpro.repository;

import com.payrollpro.model.VariablePayRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VariablePayRecordRepository extends JpaRepository<VariablePayRecord, Long> {

    List<VariablePayRecord> findAllByCompanyIdAndYearAndMonth(Long companyId, Integer year, Integer month);

    List<VariablePayRecord> findAllByCompanyIdAndEmployeeIdAndYearAndMonth(Long companyId, Long employeeId, Integer year, Integer month);

    List<VariablePayRecord> findAllByCompanyIdAndEmployeeId(Long companyId, Long employeeId);

    List<VariablePayRecord> findAllByCompanyId(Long companyId);

    Optional<VariablePayRecord> findByCompanyIdAndId(Long companyId, Long id);

    void deleteAllByCompanyIdAndYearAndMonth(Long companyId, Integer year, Integer month);
}

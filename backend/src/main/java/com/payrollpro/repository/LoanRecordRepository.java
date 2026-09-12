package com.payrollpro.repository;

import com.payrollpro.model.LoanRecord;
import com.payrollpro.model.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRecordRepository extends JpaRepository<LoanRecord, Long> {

    List<LoanRecord> findAllByCompanyId(Long companyId);

    List<LoanRecord> findAllByCompanyIdAndEmployeeId(Long companyId, Long employeeId);

    List<LoanRecord> findAllByCompanyIdAndStatus(Long companyId, LoanStatus status);

    List<LoanRecord> findAllByCompanyIdAndEmployeeIdAndStatus(Long companyId, Long employeeId, LoanStatus status);

    Optional<LoanRecord> findByCompanyIdAndId(Long companyId, Long id);
}

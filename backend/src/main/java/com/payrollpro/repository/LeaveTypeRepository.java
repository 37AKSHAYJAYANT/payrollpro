package com.payrollpro.repository;

import com.payrollpro.model.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {

    List<LeaveType> findAllByCompanyId(Long companyId);

    Optional<LeaveType> findByCompanyIdAndCode(Long companyId, String code);

    Optional<LeaveType> findByCompanyIdAndId(Long companyId, Long id);

    boolean existsByCompanyIdAndCode(Long companyId, String code);
}

package com.payrollpro.repository;

import com.payrollpro.model.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findAllByCompanyIdAndEmployeeIdAndYear(Long companyId, Long employeeId, Integer year);

    Optional<LeaveBalance> findByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(
            Long companyId, Long employeeId, Long leaveTypeId, Integer year);

    boolean existsByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(
            Long companyId, Long employeeId, Long leaveTypeId, Integer year);
}

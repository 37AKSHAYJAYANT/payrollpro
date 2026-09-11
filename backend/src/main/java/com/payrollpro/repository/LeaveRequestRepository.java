package com.payrollpro.repository;

import com.payrollpro.model.LeaveRequest;
import com.payrollpro.model.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findAllByCompanyIdAndEmployeeIdOrderByCreatedAtDesc(Long companyId, Long employeeId);

    List<LeaveRequest> findAllByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, LeaveRequestStatus status);

    Optional<LeaveRequest> findByCompanyIdAndId(Long companyId, Long id);

    @Query("SELECT COUNT(lr) > 0 FROM LeaveRequest lr WHERE lr.companyId = :companyId " +
            "AND lr.employeeId = :employeeId " +
            "AND lr.status <> com.payrollpro.model.LeaveRequestStatus.REJECTED " +
            "AND (:fromDate <= lr.toDate AND :toDate >= lr.fromDate)")
    boolean existsOverlappingRequest(@Param("companyId") Long companyId,
                                    @Param("employeeId") Long employeeId,
                                    @Param("fromDate") LocalDate fromDate,
                                    @Param("toDate") LocalDate toDate);
}

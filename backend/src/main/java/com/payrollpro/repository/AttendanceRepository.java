package com.payrollpro.repository;

import com.payrollpro.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByCompanyIdAndEmployeeIdAndYearAndMonth(
            Long companyId, Long employeeId, Integer year, Integer month);

    List<Attendance> findAllByCompanyIdAndYearAndMonth(
            Long companyId, Integer year, Integer month);

    boolean existsByCompanyIdAndEmployeeIdAndYearAndMonth(
            Long companyId, Long employeeId, Integer year, Integer month);

    long countByCompanyIdAndYearAndMonth(
            Long companyId, Integer year, Integer month);
}

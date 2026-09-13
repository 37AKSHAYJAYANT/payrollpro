package com.payrollpro.repository;

import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findAllByCompanyId(Long companyId);

    Page<Employee> findAllByCompanyId(Long companyId, Pageable pageable);

    Optional<Employee> findByCompanyIdAndId(Long companyId, Long id);

    List<Employee> findByCompanyIdAndIdIn(Long companyId, java.util.Collection<Long> ids);

    Optional<Employee> findByCompanyIdAndEmpCode(Long companyId, String empCode);

    boolean existsByCompanyIdAndEmail(Long companyId, String email);

    boolean existsByCompanyIdAndEmpCode(Long companyId, String empCode);

    long countByCompanyId(Long companyId);

    @Query("SELECT e FROM Employee e WHERE e.companyId = :companyId AND (" +
            "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.empCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.department) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchEmployees(@Param("companyId") Long companyId,
                                  @Param("search") String search,
                                  Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE e.companyId = :companyId " +
            "AND (:search IS NULL OR :search = '' OR " +
            "     LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(e.empCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(e.department) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(e.designation) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department)) " +
            "AND (:status IS NULL OR e.status = :status)")
    Page<Employee> filterEmployees(@Param("companyId") Long companyId,
                                  @Param("search") String search,
                                  @Param("department") String department,
                                  @Param("status") EmployeeStatus status,
                                  Pageable pageable);

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.companyId = :companyId AND e.department IS NOT NULL ORDER BY e.department ASC")
    List<String> findDistinctDepartmentsByCompanyId(@Param("companyId") Long companyId);
}

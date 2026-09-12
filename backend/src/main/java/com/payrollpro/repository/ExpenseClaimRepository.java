package com.payrollpro.repository;

import com.payrollpro.model.ExpenseClaim;
import com.payrollpro.model.ExpenseClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, Long> {

    List<ExpenseClaim> findAllByCompanyId(Long companyId);

    List<ExpenseClaim> findAllByCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<ExpenseClaim> findAllByCompanyIdAndEmployeeId(Long companyId, Long employeeId);

    List<ExpenseClaim> findAllByCompanyIdAndEmployeeIdOrderByClaimDateDesc(Long companyId, Long employeeId);

    List<ExpenseClaim> findAllByCompanyIdAndStatus(Long companyId, ExpenseClaimStatus status);

    List<ExpenseClaim> findAllByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, ExpenseClaimStatus status);

    List<ExpenseClaim> findAllByCompanyIdAndEmployeeIdAndStatusAndClaimDateBetween(
            Long companyId, Long employeeId, ExpenseClaimStatus status, LocalDate startDate, LocalDate endDate);

    Optional<ExpenseClaim> findByCompanyIdAndId(Long companyId, Long id);
}

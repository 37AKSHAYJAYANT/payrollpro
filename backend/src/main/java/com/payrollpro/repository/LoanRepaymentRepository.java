package com.payrollpro.repository;

import com.payrollpro.model.LoanRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepaymentRepository extends JpaRepository<LoanRepayment, Long> {

    List<LoanRepayment> findAllByCompanyIdAndLoanId(Long companyId, Long loanId);

    List<LoanRepayment> findAllByCompanyIdAndEmployeeId(Long companyId, Long employeeId);

    List<LoanRepayment> findAllByCompanyIdAndPayrollRunId(Long companyId, Long payrollRunId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("DELETE FROM LoanRepayment lr WHERE lr.companyId = :companyId AND lr.payrollRunId = :payrollRunId")
    void deleteAllByCompanyIdAndPayrollRunId(@org.springframework.data.repository.query.Param("companyId") Long companyId, @org.springframework.data.repository.query.Param("payrollRunId") Long payrollRunId);
}

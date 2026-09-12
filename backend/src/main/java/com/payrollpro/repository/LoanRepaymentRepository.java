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

    void deleteAllByCompanyIdAndPayrollRunId(Long companyId, Long payrollRunId);
}

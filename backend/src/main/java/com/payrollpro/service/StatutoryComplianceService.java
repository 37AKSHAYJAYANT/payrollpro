package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.StatutorySummaryResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StatutoryComplianceService {

    private static final BigDecimal EPF_WAGE_CEILING = new BigDecimal("15000.00");
    private static final BigDecimal ESIC_WAGE_CEILING = new BigDecimal("21000.00");
    private static final BigDecimal EE_EPF_RATE = new BigDecimal("0.12");
    private static final BigDecimal EPS_RATE = new BigDecimal("0.0833");
    private static final BigDecimal EE_ESIC_RATE = new BigDecimal("0.0075");
    private static final BigDecimal ER_ESIC_RATE = new BigDecimal("0.0325");

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final EmployeeRepository employeeRepository;

    public StatutoryComplianceService(PayrollRunRepository payrollRunRepository,
                                      PayrollRecordRepository payrollRecordRepository,
                                      EmployeeRepository employeeRepository) {
        this.payrollRunRepository = payrollRunRepository;
        this.payrollRecordRepository = payrollRecordRepository;
        this.employeeRepository = employeeRepository;
    }

    private Long getRequiredCompanyId() {
        return TenantContext.getRequiredCompanyId();
    }

    /**
     * Calculates summary metrics for EPFO and ESIC for a given payroll run.
     */
    public StatutorySummaryResponse getStatutorySummary(Long payrollRunId) {
        Long companyId = getRequiredCompanyId();
        payrollRunRepository.findByCompanyIdAndId(companyId, payrollRunId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found: " + payrollRunId));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, payrollRunId);
        employeeRepository.findAllByCompanyId(companyId);
        StatutorySummaryResponse summary = new StatutorySummaryResponse();
        summary.setPayrollRunId(payrollRunId);
        summary.setTotalEmployees(records.size());

        BigDecimal totalEpfWages = BigDecimal.ZERO;
        BigDecimal totalEeEpf = BigDecimal.ZERO;
        BigDecimal totalErEpf = BigDecimal.ZERO;
        BigDecimal totalEps = BigDecimal.ZERO;
        int epfCount = 0;

        BigDecimal totalEsicWages = BigDecimal.ZERO;
        BigDecimal totalEeEsic = BigDecimal.ZERO;
        BigDecimal totalErEsic = BigDecimal.ZERO;
        int esicCount = 0;

        for (PayrollRecord rec : records) {
            BigDecimal basic = rec.getBasicEarned() != null ? rec.getBasicEarned() : BigDecimal.ZERO;
            BigDecimal gross = rec.getGrossEarned() != null ? rec.getGrossEarned() : BigDecimal.ZERO;

            if (basic.compareTo(BigDecimal.ZERO) > 0) {
                epfCount++;
                EpfShare epf = computeEpfShare(basic, rec.getEpfDeduction());
                totalEpfWages = totalEpfWages.add(epf.getEpfWage());
                totalEeEpf = totalEeEpf.add(epf.getEeShare());
                totalEps = totalEps.add(epf.getEpsShare());
                totalErEpf = totalErEpf.add(epf.getErShare());
            }

            if (gross.compareTo(BigDecimal.ZERO) > 0 && gross.compareTo(ESIC_WAGE_CEILING) <= 0) {
                esicCount++;
                EsicShare esic = computeEsicShare(gross);
                totalEsicWages = totalEsicWages.add(gross);
                totalEeEsic = totalEeEsic.add(esic.getEeShare());
                totalErEsic = totalErEsic.add(esic.getErShare());
            }
        }

        summary.setEpfEligibleCount(epfCount);
        summary.setTotalEpfWages(totalEpfWages.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalEeEpfContribution(totalEeEpf.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalErEpfContribution(totalErEpf.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalEpsContribution(totalEps.setScale(2, RoundingMode.HALF_UP));

        summary.setEsicEligibleCount(esicCount);
        summary.setTotalEsicWages(totalEsicWages.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalEeEsicContribution(totalEeEsic.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalErEsicContribution(totalErEsic.setScale(2, RoundingMode.HALF_UP));

        return summary;
    }

    /**
     * Generates standard EPFO Electronic Challan cum Return (ECR) text file with `#~#` delimiter.
     */
    public byte[] generateEpfoEcrText(Long payrollRunId) {
        Long companyId = getRequiredCompanyId();
        payrollRunRepository.findByCompanyIdAndId(companyId, payrollRunId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found: " + payrollRunId));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, payrollRunId);
        List<Employee> employees = employeeRepository.findAllByCompanyId(companyId);
        Map<Long, Employee> employeeMap = employees.stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        StringBuilder sb = new StringBuilder();
        String DELIM = "#~#";

        for (PayrollRecord rec : records) {
            Employee emp = employeeMap.get(rec.getEmployeeId());
            if (emp == null) continue;

            String uan = emp.getAadhaarNumber() != null && !emp.getAadhaarNumber().isBlank()
                    ? emp.getAadhaarNumber()
                    : String.format("10%010d", emp.getId());
            String memberName = (emp.getFirstName() + " " + emp.getLastName()).trim().toUpperCase();

            BigDecimal gross = rec.getGrossEarned() != null ? rec.getGrossEarned() : BigDecimal.ZERO;
            BigDecimal basic = rec.getBasicEarned() != null ? rec.getBasicEarned() : BigDecimal.ZERO;

            EpfShare epf = computeEpfShare(basic, rec.getEpfDeduction());
            int workingDays = rec.getTotalWorkingDays() != null ? rec.getTotalWorkingDays() : 30;
            BigDecimal payable = rec.getPayableDays() != null ? rec.getPayableDays() : BigDecimal.valueOf(workingDays);
            int ncpDays = Math.max(0, workingDays - payable.intValue());

            // 1#~#2#~#3#~#4#~#5#~#6#~#7#~#8#~#9#~#10#~#11
            sb.append(uan).append(DELIM)
              .append(memberName).append(DELIM)
              .append(gross.setScale(0, RoundingMode.HALF_UP)).append(DELIM)
              .append(epf.getEpfWage()).append(DELIM)
              .append(epf.getEpfWage()).append(DELIM)
              .append(epf.getEpfWage()).append(DELIM)
              .append(epf.getEeShare()).append(DELIM)
              .append(epf.getEpsShare()).append(DELIM)
              .append(epf.getErShare()).append(DELIM)
              .append(ncpDays).append(DELIM)
              .append("0\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generates ESIC monthly contribution return CSV file for employees earning gross <= 21000.
     */
    public byte[] generateEsicReturnCsv(Long payrollRunId) {
        Long companyId = getRequiredCompanyId();
        payrollRunRepository.findByCompanyIdAndId(companyId, payrollRunId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found: " + payrollRunId));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, payrollRunId);
        List<Employee> employees = employeeRepository.findAllByCompanyId(companyId);
        Map<Long, Employee> employeeMap = employees.stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        StringBuilder sb = new StringBuilder();
        sb.append("IP Number,IP Name,No of Days Worked,Total Monthly Wages,Reason Code,Last Working Day,Employee Contribution (0.75%),Employer Contribution (3.25%),Total Contribution\n");

        for (PayrollRecord rec : records) {
            Employee emp = employeeMap.get(rec.getEmployeeId());
            if (emp == null) continue;

            BigDecimal gross = rec.getGrossEarned() != null ? rec.getGrossEarned() : BigDecimal.ZERO;

            if (gross.compareTo(ESIC_WAGE_CEILING) <= 0 && gross.compareTo(BigDecimal.ZERO) > 0) {
                String ipNumber = String.format("31%08d", emp.getId());
                String ipName = "\"" + (emp.getFirstName() + " " + emp.getLastName()).trim() + "\"";
                BigDecimal workedDays = rec.getPayableDays() != null ? rec.getPayableDays() : BigDecimal.valueOf(30);

                EsicShare esic = computeEsicShare(gross);

                sb.append(ipNumber).append(",")
                  .append(ipName).append(",")
                  .append(workedDays.setScale(1, RoundingMode.HALF_UP)).append(",")
                  .append(gross.setScale(2, RoundingMode.HALF_UP)).append(",")
                  .append("0,")
                  .append(",")
                  .append(esic.getEeShare()).append(",")
                  .append(esic.getErShare()).append(",")
                  .append(esic.getTotalShare()).append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public EpfShare computeEpfShare(BigDecimal basic, BigDecimal recordEeDeduction) {
        BigDecimal epfWage = basic.min(EPF_WAGE_CEILING).setScale(0, RoundingMode.HALF_UP);
        BigDecimal eeShare = (recordEeDeduction != null && recordEeDeduction.compareTo(BigDecimal.ZERO) > 0)
                ? recordEeDeduction.setScale(0, RoundingMode.HALF_UP)
                : epfWage.multiply(EE_EPF_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal epsShare = epfWage.multiply(EPS_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal erShare = eeShare.subtract(epsShare).max(BigDecimal.ZERO);
        return new EpfShare(epfWage, eeShare, epsShare, erShare);
    }

    public EsicShare computeEsicShare(BigDecimal gross) {
        BigDecimal eeEsic = gross.multiply(EE_ESIC_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal erEsic = gross.multiply(ER_ESIC_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalEsic = eeEsic.add(erEsic);
        return new EsicShare(eeEsic, erEsic, totalEsic);
    }

    public static class EpfShare {
        private final BigDecimal epfWage;
        private final BigDecimal eeShare;
        private final BigDecimal epsShare;
        private final BigDecimal erShare;

        public EpfShare(BigDecimal epfWage, BigDecimal eeShare, BigDecimal epsShare, BigDecimal erShare) {
            this.epfWage = epfWage;
            this.eeShare = eeShare;
            this.epsShare = epsShare;
            this.erShare = erShare;
        }

        public BigDecimal getEpfWage() { return epfWage; }
        public BigDecimal getEeShare() { return eeShare; }
        public BigDecimal getEpsShare() { return epsShare; }
        public BigDecimal getErShare() { return erShare; }
    }

    public static class EsicShare {
        private final BigDecimal eeShare;
        private final BigDecimal erShare;
        private final BigDecimal totalShare;

        public EsicShare(BigDecimal eeShare, BigDecimal erShare, BigDecimal totalShare) {
            this.eeShare = eeShare;
            this.erShare = erShare;
            this.totalShare = totalShare;
        }

        public BigDecimal getEeShare() { return eeShare; }
        public BigDecimal getErShare() { return erShare; }
        public BigDecimal getTotalShare() { return totalShare; }
    }
}

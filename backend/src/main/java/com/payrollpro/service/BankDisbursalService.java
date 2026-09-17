package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.BankValidationError;
import com.payrollpro.dto.BankValidationSummary;
import com.payrollpro.model.BankDisbursalFormat;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.PayrollRun;
import com.payrollpro.model.PayrollRunStatus;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.PayrollRecordRepository;
import com.payrollpro.repository.PayrollRunRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class BankDisbursalService {

    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    private static final Pattern ACCOUNT_PATTERN = Pattern.compile("^[0-9]{9,18}$");

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;

    public BankDisbursalService(PayrollRunRepository payrollRunRepository,
                                PayrollRecordRepository payrollRecordRepository,
                                EmployeeRepository employeeRepository,
                                CompanyRepository companyRepository) {
        this.payrollRunRepository = payrollRunRepository;
        this.payrollRecordRepository = payrollRecordRepository;
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
    }

    private Long getRequiredCompanyId() {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        return companyId;
    }

    public BankValidationSummary validatePayrollRunBankDetails(Long payrollRunId) {
        Long companyId = getRequiredCompanyId();

        PayrollRun run = payrollRunRepository.findByCompanyIdAndId(companyId, payrollRunId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, run.getId());
        Map<Long, Employee> employeeMap = loadEmployeeMap(companyId, records);

        int totalRecords = records.size();
        int validRecords = 0;
        int invalidRecords = 0;
        BigDecimal totalPayout = BigDecimal.ZERO;
        List<BankValidationError> errors = new ArrayList<>();

        for (PayrollRecord record : records) {
            Employee emp = employeeMap.get(record.getEmployeeId());
            String empName = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
            String empCode = emp != null ? emp.getEmpCode() : "N/A";

            boolean hasError = false;

            if (record.getNetPay() == null || record.getNetPay().compareTo(BigDecimal.ZERO) <= 0) {
                errors.add(new BankValidationError(empCode, empName, "Net pay is zero or negative (₹" + record.getNetPay() + ")"));
                hasError = true;
            }

            if (emp == null) {
                errors.add(new BankValidationError(empCode, empName, "Employee profile not found"));
                hasError = true;
            } else {
                String acc = emp.getBankAccountNumber();
                if (acc == null || !ACCOUNT_PATTERN.matcher(acc.trim()).matches()) {
                    errors.add(new BankValidationError(empCode, empName, "Missing or invalid bank account number (" + (acc == null ? "blank" : acc) + ")"));
                    hasError = true;
                }

                String ifsc = emp.getIfscCode();
                if (ifsc == null || !IFSC_PATTERN.matcher(ifsc.trim().toUpperCase()).matches()) {
                    errors.add(new BankValidationError(empCode, empName, "Invalid IFSC code (" + (ifsc == null ? "blank" : ifsc) + ")"));
                    hasError = true;
                }
            }

            if (hasError) {
                invalidRecords++;
            } else {
                validRecords++;
                totalPayout = totalPayout.add(record.getNetPay());
            }
        }

        return new BankValidationSummary(totalRecords, validRecords, invalidRecords, totalPayout, errors);
    }

    public byte[] generateDisbursalFile(Long payrollRunId, BankDisbursalFormat format) {
        Long companyId = getRequiredCompanyId();

        PayrollRun run = payrollRunRepository.findByCompanyIdAndId(companyId, payrollRunId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll run not found"));

        if (run.getStatus() != PayrollRunStatus.APPROVED && run.getStatus() != PayrollRunStatus.LOCKED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bank disbursal export requires payroll run to be APPROVED or LOCKED. Current status: " + run.getStatus());
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        List<PayrollRecord> records = payrollRecordRepository.findAllByCompanyIdAndPayrollRunId(companyId, run.getId());
        Map<Long, Employee> employeeMap = loadEmployeeMap(companyId, records);

        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String periodDesc = String.format("%02d/%d", run.getMonth(), run.getYear());
        String companyDebitAccount = "CORP" + companyId + "9988";

        String content = switch (format) {
            case HDFC_CMS -> buildHdfcCmsFormat(records, employeeMap, companyDebitAccount, dateStr);
            case ICICI_CIB -> buildIciciCibFormat(records, employeeMap, companyDebitAccount, periodDesc);
            case GENERIC_NEFT -> buildGenericNeftFormat(records, employeeMap, periodDesc, company.getName());
        };

        return content.getBytes(StandardCharsets.UTF_8);
    }

    private String buildHdfcCmsFormat(List<PayrollRecord> records, Map<Long, Employee> employeeMap,
                                      String debitAccount, String dateStr) {
        StringBuilder sb = new StringBuilder();
        sb.append("Record Type|Beneficiary Code|Beneficiary Account|Amount|Beneficiary Name|IFSC|Debit Account|Value Date|Email\r\n");
        for (PayrollRecord record : records) {
            if (record.getNetPay() == null || record.getNetPay().compareTo(BigDecimal.ZERO) <= 0) continue;
            Employee emp = employeeMap.get(record.getEmployeeId());
            if (emp == null) continue;

            sb.append("P|")
              .append(clean(emp.getEmpCode())).append("|")
              .append(clean(emp.getBankAccountNumber())).append("|")
              .append(record.getNetPay().toPlainString()).append("|")
              .append(clean(emp.getFirstName() + " " + emp.getLastName())).append("|")
              .append(clean(emp.getIfscCode()).toUpperCase()).append("|")
              .append(debitAccount).append("|")
              .append(dateStr).append("|")
              .append(clean(emp.getEmail())).append("\r\n");
        }
        return sb.toString();
    }

    private String buildIciciCibFormat(List<PayrollRecord> records, Map<Long, Employee> employeeMap,
                                       String debitAccount, String periodDesc) {
        StringBuilder sb = new StringBuilder();
        sb.append("Payment Type,Beneficiary Account,Amount,Beneficiary Name,IFSC,Debit Account Number,Remarks\r\n");
        for (PayrollRecord record : records) {
            if (record.getNetPay() == null || record.getNetPay().compareTo(BigDecimal.ZERO) <= 0) continue;
            Employee emp = employeeMap.get(record.getEmployeeId());
            if (emp == null) continue;

            sb.append("NEFT,")
              .append(escapeCsv(clean(emp.getBankAccountNumber()))).append(",")
              .append(record.getNetPay().toPlainString()).append(",")
              .append(escapeCsv(clean(emp.getFirstName() + " " + emp.getLastName()))).append(",")
              .append(escapeCsv(clean(emp.getIfscCode()).toUpperCase())).append(",")
              .append(escapeCsv(debitAccount)).append(",")
              .append(escapeCsv("Salary " + periodDesc)).append("\r\n");
        }
        return sb.toString();
    }

    private String buildGenericNeftFormat(List<PayrollRecord> records, Map<Long, Employee> employeeMap,
                                          String periodDesc, String companyName) {
        StringBuilder sb = new StringBuilder();
        sb.append("Beneficiary Account Number,Beneficiary Name,IFSC Code,Amount,Payment Reference,Remarks\r\n");
        for (PayrollRecord record : records) {
            if (record.getNetPay() == null || record.getNetPay().compareTo(BigDecimal.ZERO) <= 0) continue;
            Employee emp = employeeMap.get(record.getEmployeeId());
            if (emp == null) continue;

            String ref = record.getPayslipRef() != null ? record.getPayslipRef() : "SAL-" + record.getId();
            String remarks = "Salary for " + periodDesc + " - " + companyName;

            sb.append(escapeCsv(clean(emp.getBankAccountNumber()))).append(",")
              .append(escapeCsv(clean(emp.getFirstName() + " " + emp.getLastName()))).append(",")
              .append(escapeCsv(clean(emp.getIfscCode()).toUpperCase())).append(",")
              .append(record.getNetPay().toPlainString()).append(",")
              .append(escapeCsv(ref)).append(",")
              .append(escapeCsv(remarks)).append("\r\n");
        }
        return sb.toString();
    }

    private Map<Long, Employee> loadEmployeeMap(Long companyId, List<PayrollRecord> records) {
        Map<Long, Employee> map = new HashMap<>();
        List<Employee> allEmployees = employeeRepository.findAllByCompanyId(companyId);
        for (Employee emp : allEmployees) {
            map.put(emp.getId(), emp);
        }
        return map;
    }

    private String clean(String str) {
        return str == null ? "" : str.trim();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n") || val.contains("\r")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}

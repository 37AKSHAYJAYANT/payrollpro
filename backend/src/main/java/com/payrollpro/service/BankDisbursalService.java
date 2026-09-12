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

        StringBuilder sb = new StringBuilder();
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String periodDesc = String.format("%02d/%d", run.getMonth(), run.getYear());
        String companyDebitAccount = "CORP" + companyId + "9988";

        switch (format) {
            case HDFC_CMS:
                // HDFC CMS Pipe-Delimited:
                // Record Type|Beneficiary Code|Beneficiary Account|Amount|Beneficiary Name|IFSC|Debit Account|Value Date|Email
                sb.append("Record Type|Beneficiary Code|Beneficiary Account|Amount|Beneficiary Name|IFSC|Debit Account|Value Date|Email\r\n");
                for (PayrollRecord record : records) {
                    if (record.getNetPay() == null || record.getNetPay().compareTo(BigDecimal.ZERO) <= 0) continue;
                    Employee emp = employeeMap.get(record.getEmployeeId());
                    if (emp == null) continue;

                    String empCode = clean(emp.getEmpCode());
                    String acc = clean(emp.getBankAccountNumber());
                    String name = clean(emp.getFirstName() + " " + emp.getLastName());
                    String ifsc = clean(emp.getIfscCode()).toUpperCase();
                    String email = clean(emp.getEmail());

                    sb.append("P|")
                      .append(empCode).append("|")
                      .append(acc).append("|")
                      .append(record.getNetPay().toPlainString()).append("|")
                      .append(name).append("|")
                      .append(ifsc).append("|")
                      .append(companyDebitAccount).append("|")
                      .append(dateStr).append("|")
                      .append(email).append("\r\n");
                }
                break;

            case ICICI_CIB:
                // ICICI CIB Format:
                // Payment Type,Beneficiary Account,Amount,Beneficiary Name,IFSC,Debit Account Number,Remarks
                sb.append("Payment Type,Beneficiary Account,Amount,Beneficiary Name,IFSC,Debit Account Number,Remarks\r\n");
                for (PayrollRecord record : records) {
                    if (record.getNetPay() == null || record.getNetPay().compareTo(BigDecimal.ZERO) <= 0) continue;
                    Employee emp = employeeMap.get(record.getEmployeeId());
                    if (emp == null) continue;

                    String acc = clean(emp.getBankAccountNumber());
                    String name = clean(emp.getFirstName() + " " + emp.getLastName());
                    String ifsc = clean(emp.getIfscCode()).toUpperCase();
                    String remarks = "Salary " + periodDesc;

                    sb.append("NEFT,")
                      .append(escapeCsv(acc)).append(",")
                      .append(record.getNetPay().toPlainString()).append(",")
                      .append(escapeCsv(name)).append(",")
                      .append(escapeCsv(ifsc)).append(",")
                      .append(escapeCsv(companyDebitAccount)).append(",")
                      .append(escapeCsv(remarks)).append("\r\n");
                }
                break;

            case GENERIC_NEFT:
            default:
                // Generic Standard NEFT/RTGS CSV:
                // Beneficiary Account Number,Beneficiary Name,IFSC Code,Amount,Payment Reference,Remarks
                sb.append("Beneficiary Account Number,Beneficiary Name,IFSC Code,Amount,Payment Reference,Remarks\r\n");
                for (PayrollRecord record : records) {
                    if (record.getNetPay() == null || record.getNetPay().compareTo(BigDecimal.ZERO) <= 0) continue;
                    Employee emp = employeeMap.get(record.getEmployeeId());
                    if (emp == null) continue;

                    String acc = clean(emp.getBankAccountNumber());
                    String name = clean(emp.getFirstName() + " " + emp.getLastName());
                    String ifsc = clean(emp.getIfscCode()).toUpperCase();
                    String ref = record.getPayslipRef() != null ? record.getPayslipRef() : "SAL-" + record.getId();
                    String remarks = "Salary for " + periodDesc + " - " + company.getName();

                    sb.append(escapeCsv(acc)).append(",")
                      .append(escapeCsv(name)).append(",")
                      .append(escapeCsv(ifsc)).append(",")
                      .append(record.getNetPay().toPlainString()).append(",")
                      .append(escapeCsv(ref)).append(",")
                      .append(escapeCsv(remarks)).append("\r\n");
                }
                break;
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
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

package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.VariablePayRequest;
import com.payrollpro.dto.VariablePayResponse;
import com.payrollpro.dto.VariablePayUploadSummary;
import com.payrollpro.model.Employee;
import com.payrollpro.model.VariablePayRecord;
import com.payrollpro.model.VariablePayType;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.VariablePayRecordRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VariablePayService {

    private final VariablePayRecordRepository variablePayRecordRepository;
    private final EmployeeRepository employeeRepository;

    public VariablePayService(VariablePayRecordRepository variablePayRecordRepository,
                              EmployeeRepository employeeRepository) {
        this.variablePayRecordRepository = variablePayRecordRepository;
        this.employeeRepository = employeeRepository;
    }

    private Long getRequiredCompanyId() {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        return companyId;
    }

    @Transactional
    public VariablePayResponse addManualEntry(VariablePayRequest request) {
        Long companyId = getRequiredCompanyId();

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, request.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive");
        }

        VariablePayRecord record = new VariablePayRecord(
                companyId,
                employee.getId(),
                request.getMonth(),
                request.getYear(),
                request.getType(),
                request.getAmount(),
                request.getRemarks()
        );

        record = variablePayRecordRepository.save(record);
        return new VariablePayResponse(record, employee);
    }

    public List<VariablePayResponse> getForMonthAndYear(int month, int year) {
        Long companyId = getRequiredCompanyId();
        List<VariablePayRecord> records = variablePayRecordRepository
                .findAllByCompanyIdAndYearAndMonth(companyId, year, month);

        Map<Long, Employee> empMap = employeeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        return records.stream()
                .map(r -> new VariablePayResponse(r, empMap.get(r.getEmployeeId())))
                .collect(Collectors.toList());
    }

    public List<VariablePayResponse> getForEmployee(Long employeeId) {
        Long companyId = getRequiredCompanyId();
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        List<VariablePayRecord> records = variablePayRecordRepository
                .findAllByCompanyIdAndEmployeeId(companyId, employeeId);

        return records.stream()
                .map(r -> new VariablePayResponse(r, employee))
                .collect(Collectors.toList());
    }

    public VariablePayResponse getById(Long id) {
        Long companyId = getRequiredCompanyId();
        VariablePayRecord record = variablePayRecordRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variable pay record not found"));

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, record.getEmployeeId())
                .orElse(null);

        return new VariablePayResponse(record, employee);
    }

    @Transactional
    public void deleteEntry(Long id) {
        Long companyId = getRequiredCompanyId();
        VariablePayRecord record = variablePayRecordRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variable pay record not found"));

        variablePayRecordRepository.delete(record);
    }

    @Transactional
    public VariablePayUploadSummary uploadCsv(MultipartFile file, int defaultMonth, int defaultYear) {
        Long companyId = getRequiredCompanyId();

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CSV file is empty or missing");
        }

        int processed = 0;
        int errors = 0;
        List<String> errorDetails = new ArrayList<>();

        Map<String, Employee> empCodeMap = employeeRepository.findAllByCompanyId(companyId).stream()
                .collect(Collectors.toMap(e -> e.getEmpCode().toUpperCase(), e -> e));

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                String trimmed = line.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }

                // Skip header line
                if (lineNumber == 1 && (trimmed.toLowerCase().contains("empcode")
                        || trimmed.toLowerCase().contains("employee")
                        || trimmed.toLowerCase().contains("type"))) {
                    continue;
                }

                String[] parts = trimmed.split(",");
                if (parts.length < 3) {
                    errors++;
                    errorDetails.add("Line " + lineNumber + ": Insufficient columns");
                    continue;
                }

                try {
                    String empCode = parts[0].trim().toUpperCase();
                    Employee emp = empCodeMap.get(empCode);
                    if (emp == null) {
                        errors++;
                        errorDetails.add("Line " + lineNumber + ": Employee with code '" + empCode + "' not found in company");
                        continue;
                    }

                    int rowMonth;
                    int rowYear;
                    String typeStr;
                    BigDecimal amount;
                    String remarks = null;

                    // Detect if parts[1] is a numeric month or a pay type
                    boolean isSecondColNumeric = false;
                    try {
                        Integer.parseInt(parts[1].trim());
                        isSecondColNumeric = true;
                    } catch (NumberFormatException ignored) {
                    }

                    if (isSecondColNumeric && parts.length >= 5) {
                        // Format: empCode, month, year, type, amount, [remarks]
                        rowMonth = Integer.parseInt(parts[1].trim());
                        rowYear = Integer.parseInt(parts[2].trim());
                        typeStr = parts[3].trim().toUpperCase();
                        amount = new BigDecimal(parts[4].trim());
                        if (parts.length > 5) {
                            remarks = parts[5].trim();
                        }
                    } else {
                        // Format: empCode, type, amount, [remarks]
                        rowMonth = defaultMonth;
                        rowYear = defaultYear;
                        typeStr = parts[1].trim().toUpperCase();
                        amount = new BigDecimal(parts[2].trim());
                        if (parts.length > 3) {
                            remarks = parts[3].trim();
                        }
                    }

                    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                        errors++;
                        errorDetails.add("Line " + lineNumber + ": Amount must be greater than zero");
                        continue;
                    }

                    VariablePayType payType = VariablePayType.valueOf(typeStr);

                    VariablePayRecord record = new VariablePayRecord(
                            companyId,
                            emp.getId(),
                            rowMonth,
                            rowYear,
                            payType,
                            amount,
                            remarks
                    );

                    variablePayRecordRepository.save(record);
                    processed++;

                } catch (IllegalArgumentException ex) {
                    errors++;
                    errorDetails.add("Line " + lineNumber + ": Invalid variable pay type or number format — " + ex.getMessage());
                } catch (Exception ex) {
                    errors++;
                    errorDetails.add("Line " + lineNumber + ": Error processing row — " + ex.getMessage());
                }
            }

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read CSV file: " + e.getMessage());
        }

        return new VariablePayUploadSummary(processed, errors, errorDetails);
    }
}

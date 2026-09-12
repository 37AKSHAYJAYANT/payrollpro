package com.payrollpro.service;

import com.payrollpro.model.Attendance;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.SalaryStructure;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PayrollCalculationService {

    public PayrollRecord calculateForEmployee(Employee employee,
                                              SalaryStructure salaryStructure,
                                              Attendance attendance,
                                              Long payrollRunId) {
        return calculateForEmployee(employee, salaryStructure, attendance, payrollRunId, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public PayrollRecord calculateForEmployee(Employee employee,
                                              SalaryStructure salaryStructure,
                                              Attendance attendance,
                                              Long payrollRunId,
                                              BigDecimal variableEarnings,
                                              BigDecimal variableDeductions) {
        PayrollRecord record = new PayrollRecord();
        record.setCompanyId(employee.getCompanyId());
        record.setPayrollRunId(payrollRunId);
        record.setEmployeeId(employee.getId());
        record.setMonth(attendance.getMonth());
        record.setYear(attendance.getYear());

        // Unique payslip reference: e.g. PS-2026-09-EMP001
        String cleanEmpCode = employee.getEmpCode().replace("-", "");
        String payslipRef = String.format("PS-%04d-%02d-%s",
                attendance.getYear(), attendance.getMonth(), cleanEmpCode);
        record.setPayslipRef(payslipRef);

        int totalWorking = attendance.getTotalWorkingDays();
        BigDecimal payableDays = attendance.getPayableDays() != null
                ? attendance.getPayableDays()
                : BigDecimal.ZERO;

        record.setTotalWorkingDays(totalWorking);
        record.setPayableDays(payableDays);

        // 1. EARNINGS (Prorated by Attendance)
        BigDecimal prorationFactor = BigDecimal.ZERO;
        if (totalWorking > 0 && payableDays.compareTo(BigDecimal.ZERO) > 0) {
            prorationFactor = payableDays.divide(BigDecimal.valueOf(totalWorking), 6, RoundingMode.HALF_UP);
        }

        BigDecimal basicEarned = salaryStructure.getBasicSalary()
                .multiply(prorationFactor)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal hraEarned = salaryStructure.getHra()
                .multiply(prorationFactor)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal specialAllowanceEarned = salaryStructure.getSpecialAllowance()
                .multiply(prorationFactor)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal grossEarned = basicEarned.add(hraEarned).add(specialAllowanceEarned);
        if (variableEarnings != null && variableEarnings.compareTo(BigDecimal.ZERO) > 0) {
            grossEarned = grossEarned.add(variableEarnings);
        }

        record.setBasicEarned(basicEarned);
        record.setHraEarned(hraEarned);
        record.setSpecialAllowanceEarned(specialAllowanceEarned);
        record.setGrossEarned(grossEarned);

        // 2. DEDUCTIONS (Flat statutory amounts, not prorated per specs.md Section 6)
        BigDecimal epf = salaryStructure.getEpfEmployee() != null
                ? salaryStructure.getEpfEmployee()
                : BigDecimal.ZERO;

        BigDecimal pt = salaryStructure.getProfessionalTax() != null
                ? salaryStructure.getProfessionalTax()
                : BigDecimal.ZERO;

        BigDecimal tds = salaryStructure.getMonthlyTds() != null
                ? salaryStructure.getMonthlyTds()
                : BigDecimal.ZERO;

        BigDecimal totalDeductions = epf.add(pt).add(tds);
        if (variableDeductions != null && variableDeductions.compareTo(BigDecimal.ZERO) > 0) {
            totalDeductions = totalDeductions.add(variableDeductions);
        }

        record.setEpfDeduction(epf);
        record.setProfessionalTax(pt);
        record.setTdsDeduction(tds);
        record.setTotalDeductions(totalDeductions);

        // 3. NET PAY = Gross Earned - Total Deductions
        BigDecimal netPay = grossEarned.subtract(totalDeductions);
        record.setReimbursements(BigDecimal.ZERO);
        record.setNetPay(netPay);

        return record;
    }
}

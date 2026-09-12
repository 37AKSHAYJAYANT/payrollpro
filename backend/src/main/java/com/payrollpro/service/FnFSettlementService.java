package com.payrollpro.service;

import com.payrollpro.config.TenantContext;
import com.payrollpro.dto.FnFSettlementCalculationRequest;
import com.payrollpro.dto.FnFSettlementResponse;
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import com.payrollpro.model.FnFSettlement;
import com.payrollpro.model.FnFSettlementStatus;
import com.payrollpro.model.LeaveBalance;
import com.payrollpro.model.LeaveType;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.FnFSettlementRepository;
import com.payrollpro.repository.LeaveBalanceRepository;
import com.payrollpro.repository.LeaveTypeRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FnFSettlementService {

    private static final BigDecimal DAYS_IN_MONTH_BASIC = new BigDecimal("26");
    private static final BigDecimal DAYS_IN_MONTH_GROSS = new BigDecimal("30");
    private static final BigDecimal GRATUITY_FACTOR = new BigDecimal("15");
    private static final BigDecimal GRATUITY_MAX_CAP = new BigDecimal("2000000.00"); // 20 Lakhs Indian statutory cap

    private final FnFSettlementRepository fnfSettlementRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final CompanyRepository companyRepository;

    public FnFSettlementService(FnFSettlementRepository fnfSettlementRepository,
                                EmployeeRepository employeeRepository,
                                SalaryStructureRepository salaryStructureRepository,
                                LeaveTypeRepository leaveTypeRepository,
                                LeaveBalanceRepository leaveBalanceRepository,
                                CompanyRepository companyRepository) {
        this.fnfSettlementRepository = fnfSettlementRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.companyRepository = companyRepository;
    }

    private Long getRequiredCompanyId() {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        }
        return companyId;
    }

    public FnFSettlementResponse calculatePreview(FnFSettlementCalculationRequest request) {
        Long companyId = getRequiredCompanyId();
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, request.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        SalaryStructure salary = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, employee.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee salary structure not configured"));

        LocalDate lDate = request.getLastWorkingDate() != null ? request.getLastWorkingDate() : LocalDate.now();
        LocalDate rDate = request.getResignationDate() != null ? request.getResignationDate() : lDate.minusDays(30);

        long totalDaysOfService = ChronoUnit.DAYS.between(employee.getDateOfJoining(), lDate);
        int completedYears = (int) (totalDaysOfService / 365);

        BigDecimal basic = salary.getBasicSalary();
        BigDecimal gross = salary.getMonthlyGross();

        // 1. Gratuity (tenure >= 5 years)
        BigDecimal gratuity = BigDecimal.ZERO;
        if (completedYears >= 5) {
            gratuity = basic.multiply(GRATUITY_FACTOR)
                    .multiply(BigDecimal.valueOf(completedYears))
                    .divide(DAYS_IN_MONTH_BASIC, 2, RoundingMode.HALF_UP);
            if (gratuity.compareTo(GRATUITY_MAX_CAP) > 0) {
                gratuity = GRATUITY_MAX_CAP;
            }
        }

        // 2. EL Encashment
        BigDecimal elDays = BigDecimal.ZERO;
        Optional<LeaveType> elTypeOpt = leaveTypeRepository.findByCompanyIdAndCode(companyId, "EL");
        if (elTypeOpt.isPresent()) {
            Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(
                    companyId, employee.getId(), elTypeOpt.get().getId(), lDate.getYear());
            if (balOpt.isPresent() && balOpt.get().getRemaining() != null) {
                elDays = balOpt.get().getRemaining().max(BigDecimal.ZERO);
            }
        }
        BigDecimal leaveEncashment = basic.multiply(elDays).divide(DAYS_IN_MONTH_BASIC, 2, RoundingMode.HALF_UP);

        // 3. Notice Recovery
        int noticeDays = request.getNoticePeriodDays() != null ? request.getNoticePeriodDays() : 30;
        int servedDays = request.getServedDays() != null ? request.getServedDays() : noticeDays;
        int shortfall = Math.max(0, noticeDays - servedDays);
        BigDecimal noticeRecovery = BigDecimal.ZERO;
        if (shortfall > 0) {
            noticeRecovery = gross.multiply(BigDecimal.valueOf(shortfall)).divide(DAYS_IN_MONTH_GROSS, 2, RoundingMode.HALF_UP);
        }

        BigDecimal additions = request.getOtherAdditions() != null ? request.getOtherAdditions() : BigDecimal.ZERO;
        BigDecimal deductions = request.getOtherDeductions() != null ? request.getOtherDeductions() : BigDecimal.ZERO;

        BigDecimal netSettlement = leaveEncashment.add(gratuity).add(additions)
                .subtract(noticeRecovery).subtract(deductions).setScale(2, RoundingMode.HALF_UP);

        FnFSettlementResponse resp = new FnFSettlementResponse();
        resp.setEmployeeId(employee.getId());
        resp.setEmpCode(employee.getEmpCode());
        resp.setEmployeeName(employee.getFirstName() + " " + employee.getLastName());
        resp.setDepartment(employee.getDepartment());
        resp.setDateOfJoining(employee.getDateOfJoining());
        resp.setResignationDate(rDate);
        resp.setLastWorkingDate(lDate);
        resp.setCompletedYearsOfService(completedYears);
        resp.setNoticePeriodDays(noticeDays);
        resp.setServedDays(servedDays);
        resp.setBasicSalary(basic);
        resp.setGrossSalary(gross);
        resp.setLeaveEncashmentDays(elDays);
        resp.setLeaveEncashmentAmount(leaveEncashment);
        resp.setGratuityAmount(gratuity);
        resp.setNoticeRecoveryAmount(noticeRecovery);
        resp.setOtherAdditions(additions);
        resp.setOtherDeductions(deductions);
        resp.setNetSettlementAmount(netSettlement);
        resp.setStatus(FnFSettlementStatus.DRAFT);
        resp.setRemarks(request.getRemarks());

        return resp;
    }

    @Transactional
    public FnFSettlementResponse saveSettlement(FnFSettlementCalculationRequest request) {
        Long companyId = getRequiredCompanyId();
        FnFSettlementResponse preview = calculatePreview(request);

        Optional<FnFSettlement> existingOpt = fnfSettlementRepository.findByCompanyIdAndEmployeeId(companyId, request.getEmployeeId());
        FnFSettlement settlement = existingOpt.orElseGet(FnFSettlement::new);

        settlement.setCompanyId(companyId);
        settlement.setEmployeeId(request.getEmployeeId());
        settlement.setResignationDate(preview.getResignationDate());
        settlement.setLastWorkingDate(preview.getLastWorkingDate());
        settlement.setNoticePeriodDays(preview.getNoticePeriodDays());
        settlement.setServedDays(preview.getServedDays());
        settlement.setLeaveEncashmentDays(preview.getLeaveEncashmentDays());
        settlement.setLeaveEncashmentAmount(preview.getLeaveEncashmentAmount());
        settlement.setGratuityAmount(preview.getGratuityAmount());
        settlement.setNoticeRecoveryAmount(preview.getNoticeRecoveryAmount());
        settlement.setOtherAdditions(preview.getOtherAdditions());
        settlement.setOtherDeductions(preview.getOtherDeductions());
        settlement.setNetSettlementAmount(preview.getNetSettlementAmount());
        settlement.setStatus(FnFSettlementStatus.DRAFT);
        settlement.setRemarks(request.getRemarks());

        FnFSettlement saved = fnfSettlementRepository.save(settlement);

        // Update employee status to EXITED and set dateOfExit
        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, request.getEmployeeId()).orElse(null);
        if (emp != null) {
            emp.setStatus(EmployeeStatus.EXITED);
            emp.setDateOfExit(preview.getLastWorkingDate());
            employeeRepository.save(emp);
        }

        preview.setId(saved.getId());
        preview.setCreatedAt(saved.getCreatedAt());
        return preview;
    }

    @Transactional
    public FnFSettlementResponse approveSettlement(Long settlementId) {
        Long companyId = getRequiredCompanyId();
        FnFSettlement settlement = fnfSettlementRepository.findByCompanyIdAndId(companyId, settlementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settlement not found"));

        settlement.setStatus(FnFSettlementStatus.APPROVED);
        FnFSettlement saved = fnfSettlementRepository.save(settlement);

        return mapToResponse(saved);
    }

    public List<FnFSettlementResponse> getAllSettlements() {
        Long companyId = getRequiredCompanyId();
        return fnfSettlementRepository.findAllByCompanyId(companyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FnFSettlementResponse getSettlementByEmployeeId(Long employeeId) {
        Long companyId = getRequiredCompanyId();
        FnFSettlement settlement = fnfSettlementRepository.findByCompanyIdAndEmployeeId(companyId, employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No settlement found for employee"));
        return mapToResponse(settlement);
    }

    public byte[] generateSettlementPdf(Long settlementId) {
        Long companyId = getRequiredCompanyId();
        FnFSettlement settlement = fnfSettlementRepository.findByCompanyIdAndId(companyId, settlementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settlement record not found"));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, settlement.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        SalaryStructure salary = salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, emp.getId())
                .orElse(new SalaryStructure());

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(30, 41, 59));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(79, 70, 229));
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(51, 65, 85));
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(15, 23, 42));

            // Header
            Paragraph title = new Paragraph(company.getName().toUpperCase(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);

            Paragraph docType = new Paragraph("FULL & FINAL SETTLEMENT STATEMENT", subTitleFont);
            docType.setAlignment(Element.ALIGN_CENTER);
            docType.setSpacingAfter(15);
            doc.add(docType);

            // Employee details table
            PdfPTable empTable = new PdfPTable(4);
            empTable.setWidthPercentage(100);
            empTable.setSpacingAfter(15);

            addCell(empTable, "Employee Code:", boldFont, true);
            addCell(empTable, emp.getEmpCode(), regularFont, false);
            addCell(empTable, "Employee Name:", boldFont, true);
            addCell(empTable, emp.getFirstName() + " " + emp.getLastName(), regularFont, false);

            addCell(empTable, "Department:", boldFont, true);
            addCell(empTable, emp.getDepartment(), regularFont, false);
            addCell(empTable, "Designation:", boldFont, true);
            addCell(empTable, emp.getDesignation() != null ? emp.getDesignation() : "N/A", regularFont, false);

            addCell(empTable, "Date of Joining:", boldFont, true);
            addCell(empTable, emp.getDateOfJoining().toString(), regularFont, false);
            addCell(empTable, "Last Working Day:", boldFont, true);
            addCell(empTable, settlement.getLastWorkingDate().toString(), regularFont, false);

            addCell(empTable, "Bank Account:", boldFont, true);
            addCell(empTable, emp.getBankAccountNumber() != null ? emp.getBankAccountNumber() : "N/A", regularFont, false);
            addCell(empTable, "IFSC Code:", boldFont, true);
            addCell(empTable, emp.getIfscCode() != null ? emp.getIfscCode() : "N/A", regularFont, false);

            doc.add(empTable);

            // Financial breakdown table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingAfter(20);

            // Headers
            PdfPCell h1 = new PdfPCell(new Phrase("Settlement Component", boldFont));
            h1.setBackgroundColor(new Color(241, 245, 249));
            h1.setPadding(8);
            table.addCell(h1);

            PdfPCell h2 = new PdfPCell(new Phrase("Amount (INR)", boldFont));
            h2.setBackgroundColor(new Color(241, 245, 249));
            h2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            h2.setPadding(8);
            table.addCell(h2);

            // Lines
            addRow(table, "Earned Leave Encashment (" + settlement.getLeaveEncashmentDays() + " days)",
                    "₹" + settlement.getLeaveEncashmentAmount().toPlainString(), regularFont, false);
            addRow(table, "Statutory Gratuity (Payment of Gratuity Act 1972)",
                    "₹" + settlement.getGratuityAmount().toPlainString(), regularFont, false);
            addRow(table, "Other Payouts / Reimbursements",
                    "₹" + settlement.getOtherAdditions().toPlainString(), regularFont, false);
            addRow(table, "Notice Period Shortfall Recovery (" + (settlement.getNoticePeriodDays() - settlement.getServedDays()) + " days)",
                    "- ₹" + settlement.getNoticeRecoveryAmount().toPlainString(), regularFont, false);
            addRow(table, "Other Recoveries / Deductions",
                    "- ₹" + settlement.getOtherDeductions().toPlainString(), regularFont, false);

            // Net row
            addRow(table, "NET SETTLEMENT PAYABLE",
                    "₹" + settlement.getNetSettlementAmount().toPlainString(), boldFont, true);

            doc.add(table);

            // Status & signatures
            Paragraph statusPara = new Paragraph("Settlement Status: " + settlement.getStatus(), boldFont);
            statusPara.setSpacingAfter(30);
            doc.add(statusPara);

            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(100);
            PdfPCell c1 = new PdfPCell(new Phrase("__________________________\nEmployee Acceptance Signature", regularFont));
            c1.setBorder(0);
            sigTable.addCell(c1);

            PdfPCell c2 = new PdfPCell(new Phrase("__________________________\nAuthorized HR / Finance Signatory", regularFont));
            c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            c2.setBorder(0);
            sigTable.addCell(c2);

            doc.add(sigTable);
            doc.close();

            return out.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to render settlement statement PDF: " + e.getMessage());
        }
    }

    private void addCell(PdfPTable table, String text, Font font, boolean isHeader) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        if (isHeader) {
            cell.setBackgroundColor(new Color(248, 250, 252));
        }
        table.addCell(cell);
    }

    private void addRow(PdfPTable table, String label, String value, Font font, boolean highlight) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, font));
        c1.setPadding(7);
        if (highlight) c1.setBackgroundColor(new Color(238, 242, 255));
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, font));
        c2.setPadding(7);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (highlight) c2.setBackgroundColor(new Color(238, 242, 255));
        table.addCell(c2);
    }

    private FnFSettlementResponse mapToResponse(FnFSettlement s) {
        Long companyId = s.getCompanyId();
        Employee emp = employeeRepository.findByCompanyIdAndId(companyId, s.getEmployeeId()).orElse(null);
        SalaryStructure sal = emp != null ? salaryStructureRepository.findByCompanyIdAndEmployeeId(companyId, emp.getId()).orElse(null) : null;

        FnFSettlementResponse resp = new FnFSettlementResponse();
        resp.setId(s.getId());
        resp.setEmployeeId(s.getEmployeeId());
        resp.setEmpCode(emp != null ? emp.getEmpCode() : "N/A");
        resp.setEmployeeName(emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown");
        resp.setDepartment(emp != null ? emp.getDepartment() : "N/A");
        resp.setDateOfJoining(emp != null ? emp.getDateOfJoining() : null);
        resp.setResignationDate(s.getResignationDate());
        resp.setLastWorkingDate(s.getLastWorkingDate());
        resp.setNoticePeriodDays(s.getNoticePeriodDays());
        resp.setServedDays(s.getServedDays());
        resp.setBasicSalary(sal != null ? sal.getBasicSalary() : BigDecimal.ZERO);
        resp.setGrossSalary(sal != null ? sal.getMonthlyGross() : BigDecimal.ZERO);
        resp.setLeaveEncashmentDays(s.getLeaveEncashmentDays());
        resp.setLeaveEncashmentAmount(s.getLeaveEncashmentAmount());
        resp.setGratuityAmount(s.getGratuityAmount());
        resp.setNoticeRecoveryAmount(s.getNoticeRecoveryAmount());
        resp.setOtherAdditions(s.getOtherAdditions());
        resp.setOtherDeductions(s.getOtherDeductions());
        resp.setNetSettlementAmount(s.getNetSettlementAmount());
        resp.setStatus(s.getStatus());
        resp.setRemarks(s.getRemarks());
        resp.setCreatedAt(s.getCreatedAt());

        if (emp != null && emp.getDateOfJoining() != null && s.getLastWorkingDate() != null) {
            long days = ChronoUnit.DAYS.between(emp.getDateOfJoining(), s.getLastWorkingDate());
            resp.setCompletedYearsOfService((int) (days / 365));
        }

        return resp;
    }
}

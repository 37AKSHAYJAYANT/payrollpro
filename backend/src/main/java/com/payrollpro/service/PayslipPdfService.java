package com.payrollpro.service;

import com.lowagie.text.Chunk;
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
import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.PayrollRecord;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.util.NumberToWordsConverter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Locale;

@Service
public class PayslipPdfService {

    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,##0.00");

    private static final Color PRIMARY_COLOR = new Color(30, 58, 138); // Deep Navy
    private static final Color SECONDARY_COLOR = new Color(71, 85, 105); // Slate
    private static final Color TABLE_HEADER_BG = new Color(241, 245, 249); // Light Slate
    private static final Color BORDER_COLOR = new Color(203, 213, 225); // Border Gray
    private static final Color NET_PAY_BG = new Color(238, 242, 255); // Indigo Light

    public String generatePayslipPassword(Employee employee) {
        if (employee == null) {
            return "XXXX0101";
        }
        String firstName = employee.getFirstName();
        StringBuilder namePart = new StringBuilder();
        if (firstName != null) {
            String upper = firstName.toUpperCase();
            for (char c : upper.toCharArray()) {
                if (Character.isLetter(c)) {
                    namePart.append(c);
                }
                if (namePart.length() == 4) {
                    break;
                }
            }
        }
        while (namePart.length() < 4) {
            namePart.append('X');
        }

        String dobPart = "0101";
        if (employee.getDateOfBirth() != null) {
            dobPart = employee.getDateOfBirth().format(DateTimeFormatter.ofPattern("ddMM"));
        }

        return namePart.toString() + dobPart;
    }

    public byte[] generateEncryptedPayslipPdf(PayrollRecord record,
                                             Employee employee,
                                             SalaryStructure salaryStructure,
                                             Company company) {
        String password = generatePayslipPassword(employee);
        return generatePayslipPdf(record, employee, salaryStructure, company, password);
    }

    public byte[] generateEncryptedPayslipPdf(PayrollRecord record,
                                             Employee employee,
                                             SalaryStructure salaryStructure,
                                             Company company,
                                             String password) {
        return generatePayslipPdf(record, employee, salaryStructure, company, password);
    }

    public byte[] generatePayslipPdf(PayrollRecord record,
                                     Employee employee,
                                     SalaryStructure salaryStructure,
                                     Company company) {
        return generatePayslipPdf(record, employee, salaryStructure, company, null);
    }

    public byte[] generatePayslipPdf(PayrollRecord record,
                                     Employee employee,
                                     SalaryStructure salaryStructure,
                                     Company company,
                                     String password) {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            if (password != null && !password.trim().isEmpty()) {
                byte[] pwdBytes = password.trim().getBytes(StandardCharsets.UTF_8);
                writer.setEncryption(
                        pwdBytes,
                        pwdBytes,
                        PdfWriter.ALLOW_PRINTING | PdfWriter.ALLOW_COPY,
                        PdfWriter.ENCRYPTION_AES_128
                );
            }
            document.open();

            // ---- Fonts ----
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, PRIMARY_COLOR);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, SECONDARY_COLOR);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, PRIMARY_COLOR);
            Font boldLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, Color.DARK_GRAY);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, PRIMARY_COLOR);
            Font tableFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, Color.BLACK);
            Font tableFontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, Color.BLACK);
            Font netPayFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, PRIMARY_COLOR);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Color.GRAY);

            // ---- Company Header ----
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            PdfPCell cNameCell = new PdfPCell(new Phrase(company != null ? company.getName() : "PayrollPro SaaS", titleFont));
            cNameCell.setBorder(0);
            cNameCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerTable.addCell(cNameCell);

            String addressText = (company != null && company.getAddress() != null) ? company.getAddress() : "Corporate Headquarters";
            String gstinText = (company != null && company.getGstin() != null) ? " | GSTIN: " + company.getGstin() : "";
            String cinText = (company != null && company.getRegistrationNumber() != null) ? " | CIN: " + company.getRegistrationNumber() : "";

            PdfPCell cMetaCell = new PdfPCell(new Phrase(addressText + cinText + gstinText, subTitleFont));
            cMetaCell.setBorder(0);
            cMetaCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cMetaCell.setPaddingTop(2);
            cMetaCell.setPaddingBottom(6);
            headerTable.addCell(cMetaCell);

            String monthName = Month.of(record.getMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase();
            PdfPCell payslipTitleCell = new PdfPCell(new Phrase("PAYSLIP FOR " + monthName + " " + record.getYear(), sectionTitleFont));
            payslipTitleCell.setBorder(0);
            payslipTitleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            payslipTitleCell.setPaddingTop(4);
            payslipTitleCell.setPaddingBottom(8);
            headerTable.addCell(payslipTitleCell);

            document.add(headerTable);

            // ---- Divider line ----
            PdfPTable divider = new PdfPTable(1);
            divider.setWidthPercentage(100);
            PdfPCell dCell = new PdfPCell();
            dCell.setBorder(com.lowagie.text.Rectangle.BOTTOM);
            dCell.setBorderColorBottom(PRIMARY_COLOR);
            dCell.setBorderWidthBottom(1.5f);
            dCell.setFixedHeight(4);
            divider.addCell(dCell);
            document.add(divider);

            document.add(new Paragraph(" "));

            // ---- Employee & Pay Period Details (2-column box) ----
            PdfPTable empTable = new PdfPTable(4);
            empTable.setWidthPercentage(100);
            empTable.setWidths(new float[]{22f, 28f, 22f, 28f});

            addMetaRow(empTable, "Employee Code:", employee.getEmpCode(), "Payslip Ref #:", record.getPayslipRef(), boldLabelFont, valueFont);
            addMetaRow(empTable, "Employee Name:", employee.getFirstName() + " " + employee.getLastName(), "Designation:", employee.getDesignation() != null ? employee.getDesignation() : "-", boldLabelFont, valueFont);
            addMetaRow(empTable, "Department:", employee.getDepartment() != null ? employee.getDepartment() : "-", "PAN Number:", employee.getPanNumber() != null ? employee.getPanNumber() : "-", boldLabelFont, valueFont);
            addMetaRow(empTable, "Bank Name:", employee.getBankName() != null ? employee.getBankName() : "-", "Bank Account:", employee.getBankAccountNumber() != null ? employee.getBankAccountNumber() : "-", boldLabelFont, valueFont);
            addMetaRow(empTable, "Total Working Days:", String.valueOf(record.getTotalWorkingDays()), "Payable Days:", record.getPayableDays().toPlainString(), boldLabelFont, valueFont);

            document.add(empTable);

            document.add(new Paragraph(" "));

            // ---- Earnings & Deductions Table ----
            PdfPTable salaryTable = new PdfPTable(4);
            salaryTable.setWidthPercentage(100);
            salaryTable.setWidths(new float[]{32f, 18f, 32f, 18f});

            // Table Headers
            addHeaderCell(salaryTable, "EARNINGS", headerFont, Element.ALIGN_LEFT);
            addHeaderCell(salaryTable, "AMOUNT (INR)", headerFont, Element.ALIGN_RIGHT);
            addHeaderCell(salaryTable, "DEDUCTIONS", headerFont, Element.ALIGN_LEFT);
            addHeaderCell(salaryTable, "AMOUNT (INR)", headerFont, Element.ALIGN_RIGHT);

            // Row 1: Basic & EPF
            addTableRow(salaryTable, "Basic Salary", CURRENCY_FORMAT.format(record.getBasicEarned()),
                    "EPF (Employee)", CURRENCY_FORMAT.format(record.getEpfDeduction()), tableFont, tableFont);

            // Row 2: HRA & PT
            addTableRow(salaryTable, "House Rent Allowance (HRA)", CURRENCY_FORMAT.format(record.getHraEarned()),
                    "Professional Tax (PT)", CURRENCY_FORMAT.format(record.getProfessionalTax()), tableFont, tableFont);

            // Row 3: Special Allowance & TDS
            addTableRow(salaryTable, "Special Allowance", CURRENCY_FORMAT.format(record.getSpecialAllowanceEarned()),
                    "TDS / Income Tax", CURRENCY_FORMAT.format(record.getTdsDeduction()), tableFont, tableFont);

            // Row 4: Expense Reimbursement (Non-taxable)
            String reimbLabel = (record.getReimbursements() != null && record.getReimbursements().compareTo(BigDecimal.ZERO) > 0)
                    ? "Expense Reimbursements" : "";
            String reimbAmount = (record.getReimbursements() != null && record.getReimbursements().compareTo(BigDecimal.ZERO) > 0)
                    ? CURRENCY_FORMAT.format(record.getReimbursements()) : "";
            addTableRow(salaryTable, reimbLabel, reimbAmount, "", "", tableFont, tableFont);

            // Total Gross & Total Deductions
            addTotalRow(salaryTable, "Gross Earnings", "INR " + CURRENCY_FORMAT.format(record.getGrossEarned()),
                    "Total Deductions", "INR " + CURRENCY_FORMAT.format(record.getTotalDeductions()), tableFontBold);

            document.add(salaryTable);

            document.add(new Paragraph(" "));

            // ---- Net Pay Box ----
            PdfPTable netTable = new PdfPTable(1);
            netTable.setWidthPercentage(100);

            PdfPCell netCell = new PdfPCell();
            netCell.setBackgroundColor(NET_PAY_BG);
            netCell.setBorderColor(new Color(199, 210, 254));
            netCell.setBorderWidth(1.2f);
            netCell.setPadding(10);

            Paragraph pNet = new Paragraph();
            pNet.add(new Chunk("NET SALARY PAYABLE:  ", sectionTitleFont));
            pNet.add(new Chunk("INR " + CURRENCY_FORMAT.format(record.getNetPay()), netPayFont));
            netCell.addElement(pNet);

            String words = NumberToWordsConverter.convertToIndianCurrency(record.getNetPay());
            Paragraph pWords = new Paragraph();
            pWords.add(new Chunk("In Words: ", boldLabelFont));
            pWords.add(new Chunk(words, valueFont));
            pWords.setSpacingBefore(4);
            netCell.addElement(pWords);

            netTable.addCell(netCell);
            document.add(netTable);

            // ---- Footer Note ----
            Paragraph footer = new Paragraph();
            footer.setSpacingBefore(20);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.add(new Chunk("This is a computer-generated payslip and does not require a physical signature.\n", smallFont));
            footer.add(new Chunk("Generated on " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss")) + " via PayrollPro", smallFont));
            document.add(footer);

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating payslip PDF: " + e.getMessage(), e);
        }
    }

    private void addMetaRow(PdfPTable table, String label1, String val1, String label2, String val2, Font lFont, Font vFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label1, lFont));
        c1.setBorder(0);
        c1.setPadding(3);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(val1, vFont));
        c2.setBorder(0);
        c2.setPadding(3);
        table.addCell(c2);

        PdfPCell c3 = new PdfPCell(new Phrase(label2, lFont));
        c3.setBorder(0);
        c3.setPadding(3);
        table.addCell(c3);

        PdfPCell c4 = new PdfPCell(new Phrase(val2, vFont));
        c4.setBorder(0);
        c4.setPadding(3);
        table.addCell(c4);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(TABLE_HEADER_BG);
        cell.setBorderColor(BORDER_COLOR);
        cell.setBorderWidth(1f);
        cell.setPadding(6);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void addTableRow(PdfPTable table, String col1, String col2, String col3, String col4, Font f1, Font f2) {
        PdfPCell c1 = new PdfPCell(new Phrase(col1, f1));
        c1.setBorderColor(BORDER_COLOR);
        c1.setPadding(5);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(col2, f2));
        c2.setBorderColor(BORDER_COLOR);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(5);
        table.addCell(c2);

        PdfPCell c3 = new PdfPCell(new Phrase(col3, f1));
        c3.setBorderColor(BORDER_COLOR);
        c3.setPadding(5);
        table.addCell(c3);

        PdfPCell c4 = new PdfPCell(new Phrase(col4, f2));
        c4.setBorderColor(BORDER_COLOR);
        c4.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c4.setPadding(5);
        table.addCell(c4);
    }

    private void addTotalRow(PdfPTable table, String col1, String col2, String col3, String col4, Font font) {
        PdfPCell c1 = new PdfPCell(new Phrase(col1, font));
        c1.setBackgroundColor(TABLE_HEADER_BG);
        c1.setBorderColor(BORDER_COLOR);
        c1.setPadding(6);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(col2, font));
        c2.setBackgroundColor(TABLE_HEADER_BG);
        c2.setBorderColor(BORDER_COLOR);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(6);
        table.addCell(c2);

        PdfPCell c3 = new PdfPCell(new Phrase(col3, font));
        c3.setBackgroundColor(TABLE_HEADER_BG);
        c3.setBorderColor(BORDER_COLOR);
        c3.setPadding(6);
        table.addCell(c3);

        PdfPCell c4 = new PdfPCell(new Phrase(col4, font));
        c4.setBackgroundColor(TABLE_HEADER_BG);
        c4.setBorderColor(BORDER_COLOR);
        c4.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c4.setPadding(6);
        table.addCell(c4);
    }
}

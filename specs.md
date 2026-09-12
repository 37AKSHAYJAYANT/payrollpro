# PayrollPro SaaS — Technical Specification Document

> **Version:** 1.0.0  
> **Last Updated:** 2026-09-10  
> **Status:** APPROVED — Ready for Implementation  
> **Target Client:** 200–500 Employee Indian Companies (Multi-Tenant SaaS)

---

## 1. Project Overview

**PayrollPro** is a multi-tenant, enterprise-grade Payroll & HRMS SaaS platform designed for Indian companies with 200–500 employees. It automates monthly salary processing, statutory compliance (EPF, ESI, Professional Tax, TDS), leave management with approval workflows, PDF payslip generation, and provides an AI-powered HR copilot via Model Context Protocol (MCP).

### Target Audience
- **HR / Payroll Administrators** — configure employees, salary structures, run monthly payroll.
- **Department Managers** — review payroll batches, approve/reject leave requests.
- **Super Admins** — final payroll approval, company-wide configuration, platform governance.
- **Employees** — self-service portal to view salary history, download payslips, submit leave requests.

### Core Problem Solved
Manual payroll processing for 200–500 employees in Excel is error-prone, non-auditable, and consumes 3–5 days/month of HR effort. PayrollPro reduces this to a **1-click batch operation** with full statutory compliance, audit trail, and AI-assisted anomaly detection.

---

## 2. Full Tech Stack

> **Development Approach:** Frontend-first — the React UI shell and login flow are built before the Spring Boot backend, enabling early UX validation with mock data.

### Frontend (Built First)
| Layer | Technology | Version |
|:------|:-----------|:--------|
| Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Routing | React Router | v6 |
| Data Tables | TanStack Table (React Table) | v8 |
| State | React Context + useReducer | — |

### Backend
| Layer | Technology | Version |
|:------|:-----------|:--------|
| Language | Java | 18 |
| Framework | Spring Boot | 3.2.5 |
| Security | Spring Security 6 + JWT (Stateless) | 6.x |
| ORM | Spring Data JPA + Hibernate | 6.x |
| Validation | Jakarta Bean Validation (`@Valid`) | 3.x |
| Build Tool | Apache Maven | 3.9.x |
| PDF Engine | OpenPDF | 2.0.x |
| DB Migration | Flyway (optional, production) | 10.x |

### Database
| Environment | Technology |
|:------------|:-----------|
| Development | H2 In-Memory (auto-schema from JPA) |
| Production | PostgreSQL 15+ (swap via application-prod.properties) |

### AI / Agentic Layer
| Component | Technology |
|:----------|:-----------|
| MCP Server | Node.js + @modelcontextprotocol/sdk v1.5+ |
| Transport | stdio (standard input/output) |
| AI Clients | Claude Code CLI, Google Antigravity |

### Deployment
| Aspect | Strategy |
|:-------|:---------|
| Dev Environment | 3 terminals: Frontend :5173, Backend :8080, MCP stdio |
| Production Packaging | Single executable JAR (`mvn package`) serving embedded React `dist/` |
| Version Control | Git + GitHub (manual commits only) |

---

## 3. Multi-Tenancy Architecture

**Strategy:** Shared Database with `companyId` Discriminator Column.

Every business entity carries a mandatory `companyId` foreign key. A Spring Security filter extracts the authenticated user's `companyId` from their JWT token and injects it as a query filter on every repository call. This guarantees:
- Company A can never access Company B's employees, payroll, or leave data.
- A single database instance serves all tenants (cost-effective for SME SaaS).
- Standard Spring Data JPA patterns work without custom Hibernate multi-tenant providers.

**Tenant Isolation Enforcement:**
```
HTTP Request → JWT Filter extracts companyId → 
  SecurityContext holds TenantContext(companyId) →
    Every @Repository query auto-filters by companyId →
      Response contains only tenant-scoped data
```

---

## 4. User Roles & Permissions Matrix

| Role | Scope | Can Do | Cannot Do |
|:-----|:------|:-------|:----------|
| `SUPER_ADMIN` | Platform-wide | Register companies, final payroll approval, view all tenants, platform settings | N/A (full access) |
| `COMPANY_ADMIN` | Single tenant | CRUD employees, configure salary structures, prepare payroll runs, manage leave types, download payslips | Approve own payroll run, access other companies |
| `MANAGER` | Single tenant | Review & advance payroll status, approve/reject leave requests for their department | Prepare payroll, modify salary structures |
| `EMPLOYEE` | Own record only | View own salary history, download own payslips, submit leave requests, view leave balances | View other employees' data, any admin actions |

---

## 5. Database Schema

### 5.1 Company (Tenant)
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK, Auto-increment |
| name | VARCHAR(200) | NOT NULL |
| registrationNumber | VARCHAR(50) | UNIQUE |
| address | VARCHAR(500) | |
| gstin | VARCHAR(20) | |
| logoUrl | VARCHAR(500) | |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | NOT NULL |

### 5.2 User (Authentication)
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company, NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| passwordHash | VARCHAR(255) | NOT NULL |
| role | ENUM | SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE |
| employeeId | BIGINT | FK → Employee (nullable, linked for MANAGER/EMPLOYEE roles) |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | |

### 5.3 Employee
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company, NOT NULL |
| empCode | VARCHAR(20) | UNIQUE per company |
| firstName | VARCHAR(100) | NOT NULL |
| lastName | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(15) | |
| department | VARCHAR(100) | NOT NULL |
| designation | VARCHAR(100) | |
| dateOfJoining | DATE | NOT NULL |
| dateOfExit | DATE | nullable |
| panNumber | VARCHAR(10) | |
| aadhaarNumber | VARCHAR(12) | |
| bankAccountNumber | VARCHAR(20) | |
| ifscCode | VARCHAR(11) | |
| bankName | VARCHAR(100) | |
| status | ENUM | ACTIVE, ON_LEAVE, EXITED |
| createdAt | TIMESTAMP | |

### 5.4 SalaryStructure
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company |
| employeeId | BIGINT | FK → Employee |
| annualCTC | DECIMAL(12,2) | NOT NULL |
| monthlyGross | DECIMAL(10,2) | Computed: annualCTC / 12 |
| basicSalary | DECIMAL(10,2) | 50% of monthlyGross |
| hra | DECIMAL(10,2) | 40% of basicSalary |
| specialAllowance | DECIMAL(10,2) | monthlyGross - basic - hra |
| epfEmployee | DECIMAL(10,2) | 12% of basicSalary |
| epfEmployer | DECIMAL(10,2) | 12% of basicSalary |
| professionalTax | DECIMAL(10,2) | State tier (default ₹200) |
| monthlyTds | DECIMAL(10,2) | Configurable per employee |
| effectiveFrom | DATE | NOT NULL |

### 5.5 LeaveType
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company |
| name | VARCHAR(50) | e.g., Casual Leave, Sick Leave, Earned Leave |
| code | VARCHAR(5) | e.g., CL, SL, EL |
| annualQuota | INTEGER | e.g., 12 |
| carryForward | BOOLEAN | DEFAULT false |

### 5.6 LeaveBalance
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company |
| employeeId | BIGINT | FK → Employee |
| leaveTypeId | BIGINT | FK → LeaveType |
| year | INTEGER | e.g., 2026 |
| totalBalance | DECIMAL(4,1) | |
| used | DECIMAL(4,1) | |
| remaining | DECIMAL(4,1) | Computed: total - used |

### 5.7 LeaveRequest
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company |
| employeeId | BIGINT | FK → Employee |
| leaveTypeId | BIGINT | FK → LeaveType |
| fromDate | DATE | NOT NULL |
| toDate | DATE | NOT NULL |
| days | DECIMAL(3,1) | NOT NULL (supports half-day) |
| reason | VARCHAR(500) | |
| status | ENUM | PENDING, APPROVED, REJECTED |
| approverId | BIGINT | FK → User (Manager) |
| approvedAt | TIMESTAMP | |
| remarks | VARCHAR(500) | Manager comment |
| createdAt | TIMESTAMP | |

### 5.8 Attendance
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company |
| employeeId | BIGINT | FK → Employee |
| month | INTEGER | 1–12 |
| year | INTEGER | e.g., 2026 |
| totalWorkingDays | INTEGER | e.g., 26 |
| presentDays | DECIMAL(4,1) | |
| paidLeaveDays | DECIMAL(4,1) | Approved CL/SL/EL consumed |
| unpaidLeaveDays | DECIMAL(4,1) | LOP (Loss of Pay) |
| payableDays | DECIMAL(4,1) | totalWorkingDays - unpaidLeaveDays |
| source | ENUM | MANUAL, CSV_UPLOAD |

### 5.9 PayrollRun (Batch Header)
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company |
| month | INTEGER | |
| year | INTEGER | |
| status | ENUM | DRAFT, MANAGER_REVIEWED, APPROVED, LOCKED |
| employeeCount | INTEGER | |
| totalGrossPay | DECIMAL(14,2) | |
| totalDeductions | DECIMAL(14,2) | |
| totalNetPay | DECIMAL(14,2) | |
| preparedBy | BIGINT | FK → User (COMPANY_ADMIN) |
| reviewedBy | BIGINT | FK → User (MANAGER) |
| approvedBy | BIGINT | FK → User (SUPER_ADMIN) |
| preparedAt | TIMESTAMP | |
| reviewedAt | TIMESTAMP | |
| approvedAt | TIMESTAMP | |

### 5.10 PayrollRecord (Per-Employee Line Item)
| Column | Type | Constraints |
|:-------|:-----|:-----------|
| id | BIGINT | PK |
| companyId | BIGINT | FK → Company |
| payrollRunId | BIGINT | FK → PayrollRun |
| employeeId | BIGINT | FK → Employee |
| month | INTEGER | |
| year | INTEGER | |
| payslipRef | VARCHAR(30) | Unique (e.g., PS-2026-09-EMP101) |
| totalWorkingDays | INTEGER | |
| payableDays | DECIMAL(4,1) | |
| basicEarned | DECIMAL(10,2) | Prorated |
| hraEarned | DECIMAL(10,2) | Prorated |
| specialAllowanceEarned | DECIMAL(10,2) | Prorated |
| grossEarned | DECIMAL(10,2) | Sum of earnings |
| epfDeduction | DECIMAL(10,2) | |
| professionalTax | DECIMAL(10,2) | |
| tdsDeduction | DECIMAL(10,2) | |
| totalDeductions | DECIMAL(10,2) | Sum of deductions |
| netPay | DECIMAL(10,2) | grossEarned - totalDeductions |

### Entity Relationship Summary
```
Company (1) ──── (*) User
Company (1) ──── (*) Employee
Company (1) ──── (*) LeaveType
Employee (1) ──── (1) SalaryStructure
Employee (1) ──── (*) LeaveBalance
Employee (1) ──── (*) LeaveRequest
Employee (1) ──── (*) Attendance
Employee (1) ──── (*) PayrollRecord
PayrollRun (1) ──── (*) PayrollRecord
LeaveType (1) ──── (*) LeaveBalance
LeaveType (1) ──── (*) LeaveRequest
```

---

## 6. Payroll Calculation Formula

```
For each active employee in the pay cycle:

1. EARNINGS (Prorated by Attendance):
   prorationFactor = payableDays / totalWorkingDays
   basicEarned = salaryStructure.basicSalary × prorationFactor
   hraEarned = salaryStructure.hra × prorationFactor
   specialAllowanceEarned = salaryStructure.specialAllowance × prorationFactor
   grossEarned = basicEarned + hraEarned + specialAllowanceEarned

2. DEDUCTIONS:
   epfDeduction = salaryStructure.epfEmployee  (flat, not prorated)
   professionalTax = salaryStructure.professionalTax
   tdsDeduction = salaryStructure.monthlyTds
   totalDeductions = epfDeduction + professionalTax + tdsDeduction

3. NET PAY:
   netPay = grossEarned - totalDeductions
   IF netPay < 0, flag as ANOMALY
```

---

## 7. API Endpoint Map

### Authentication
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| POST | `/api/auth/register` | Public | Register new company + admin user |
| POST | `/api/auth/login` | Public | Returns JWT token |

### Employee Management
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| GET | `/api/employees` | COMPANY_ADMIN, MANAGER | List all employees (paginated) |
| POST | `/api/employees` | COMPANY_ADMIN | Add new employee |
| PUT | `/api/employees/{id}` | COMPANY_ADMIN | Update employee details |
| GET | `/api/employees/{id}` | COMPANY_ADMIN, MANAGER | Get employee by ID |
| DELETE | `/api/employees/{id}` | COMPANY_ADMIN | Soft-delete (set status EXITED) |

### Salary Structure
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| GET | `/api/employees/{id}/salary` | COMPANY_ADMIN | Get salary structure |
| POST | `/api/employees/{id}/salary` | COMPANY_ADMIN | Create/update salary structure |

### Leave Management
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| POST | `/api/leaves/request` | EMPLOYEE | Submit leave request |
| GET | `/api/leaves/my-requests` | EMPLOYEE | View own leave history |
| GET | `/api/leaves/my-balance` | EMPLOYEE | View own leave balances |
| GET | `/api/leaves/pending` | MANAGER | View pending approval queue |
| PUT | `/api/leaves/{id}/approve` | MANAGER | Approve leave request |
| PUT | `/api/leaves/{id}/reject` | MANAGER | Reject leave request |

### Attendance
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| POST | `/api/attendance` | COMPANY_ADMIN | Manual attendance entry |
| POST | `/api/attendance/upload-csv` | COMPANY_ADMIN | Bulk CSV upload |
| GET | `/api/attendance?month=9&year=2026` | COMPANY_ADMIN | View attendance for month |

### Payroll
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| POST | `/api/payroll/run?month=9&year=2026` | COMPANY_ADMIN | Trigger batch payroll calculation |
| GET | `/api/payroll/runs` | COMPANY_ADMIN, MANAGER | List all payroll runs |
| GET | `/api/payroll/runs/{id}` | COMPANY_ADMIN, MANAGER | Get run details with all records |
| PUT | `/api/payroll/runs/{id}/review` | MANAGER | Advance status to MANAGER_REVIEWED |
| PUT | `/api/payroll/runs/{id}/approve` | SUPER_ADMIN | Advance status to APPROVED |
| PUT | `/api/payroll/runs/{id}/lock` | SUPER_ADMIN | Lock payroll (no further edits) |

### Payslip
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| GET | `/api/payslips/my-payslips` | EMPLOYEE | List own payslip history |
| GET | `/api/payslips/{recordId}/pdf` | EMPLOYEE, COMPANY_ADMIN | Download payslip PDF |

### Health & Diagnostics
| Method | Endpoint | Role | Description |
|:-------|:---------|:-----|:------------|
| GET | `/actuator/health` | Public | Spring Boot health probe |

---

## 8. Security & Environment Variables

### JWT Token Structure
```json
{
  "sub": "user@company.com",
  "userId": 42,
  "companyId": 7,
  "role": "COMPANY_ADMIN",
  "iat": 1694300000,
  "exp": 1694386400
}
```

### Required Environment Variables (.env)
```
# Database
SPRING_DATASOURCE_URL=jdbc:h2:mem:payrolldb
SPRING_DATASOURCE_USERNAME=sa
SPRING_DATASOURCE_PASSWORD=

# JWT
JWT_SECRET=your-256-bit-secret-key-minimum-32-characters
JWT_EXPIRATION_MS=86400000

# Server
SERVER_PORT=8080

# Production PostgreSQL (when deploying)
# SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/payrolldb
# SPRING_DATASOURCE_USERNAME=payroll_user
# SPRING_DATASOURCE_PASSWORD=secure_password
```

---

## 9. MCP Server Tool Contracts

### Tool: get_payroll_summary
```json
{
  "name": "get_payroll_summary",
  "input": { "month": 9, "year": 2026, "companyId": 1 },
  "output": {
    "employeeCount": 312,
    "totalGross": 15600000.00,
    "totalDeductions": 2340000.00,
    "totalNetPay": 13260000.00,
    "status": "APPROVED"
  }
}
```

### Tool: audit_payroll_anomalies
```json
{
  "name": "audit_payroll_anomalies",
  "input": { "month": 9, "year": 2026, "companyId": 1 },
  "output": {
    "anomalies": [
      { "empCode": "EMP-204", "issue": "Net pay is negative (-₹1,200)", "severity": "CRITICAL" },
      { "empCode": "EMP-078", "issue": "Missing IFSC code for bank transfer", "severity": "HIGH" },
      { "empCode": "EMP-341", "issue": "Zero attendance logged — LOP applied to full salary", "severity": "MEDIUM" }
    ],
    "totalAnomalies": 3,
    "recommendation": "Resolve CRITICAL issues before approving payroll run."
  }
}
```

---

## 10. Enterprise Specification: Bank Disbursal Batch Export Engine

### 10.1 Overview & Banking Standards
Enterprise payroll requires bulk payment generation formatted to corporate internet banking standards. Once a `PayrollRun` enters `APPROVED` or `LOCKED` state, finance teams can export formatted batch files.

### 10.2 Supported Bank Profiles
1. **Generic NEFT / RTGS (CSV)**
   - Headers: `Beneficiary Account Number,Beneficiary Name,IFSC Code,Amount,Payment Reference,Remarks`
2. **HDFC Bank CMS (Pipe-delimited or CSV)**
   - Format: `Record Type|Beneficiary Code|Beneficiary Account|Amount|Beneficiary Name|IFSC|Debit Account|Value Date|Email`
3. **ICICI Bank CIB (Corporate Internet Banking CSV)**
   - Format: `Payment Type,Beneficiary Account,Amount,Beneficiary Name,IFSC,Debit Account Number,Remarks`

### 10.3 Pre-Flight Validation Rules
- Account number must be 9–18 numeric characters.
- IFSC must match regular expression `^[A-Z]{4}0[A-Z0-9]{6}$`.
- Payout amount must be $> 0$ (excludes employees with negative or zero net pay).
- Flags duplicates and missing bank details before file generation.

### 10.4 REST API Contract
- `GET /api/payroll/runs/{id}/bank-export?format={GENERIC_NEFT|HDFC_CMS|ICICI_CIB}`
  - Returns `text/csv` with `Content-Disposition: attachment; filename="bank_disbursal_{month}_{year}_{format}.csv"`.
- `GET /api/payroll/runs/{id}/bank-validation`
  - Returns validation summary: `{ validCount: 198, invalidCount: 2, invalidRecords: [...] }`.

---

## 11. Enterprise Specification: Full & Final (F&F) Settlement & Gratuity Engine

### 11.1 Overview & Legal Mandates
When an employee resigns or exits, their final compensation must account for statutory leave encashment, gratuity, notice period adjustments, and asset clearance.

### 11.2 Statutory Formulas
1. **Earned Leave (EL) Encashment** (as per Factories Act & standard enterprise practice):
   $$\text{Daily Basic Wage} = \frac{\text{Monthly Basic Salary}}{26}$$
   $$\text{EL Encashment} = \text{Remaining EL Balance} \times \text{Daily Basic Wage}$$
2. **Statutory Gratuity** (under Payment of Gratuity Act 1972):
   - Eligibility: Completed tenure $\ge 5$ years (1825 days).
   $$\text{Gratuity} = \frac{15 \times \text{Last Drawn Basic} \times \text{Completed Years of Service}}{26}$$
3. **Notice Shortfall Recovery**:
   $$\text{Shortfall Deduction} = \frac{\text{Monthly Gross}}{30} \times (\text{Notice Period Days} - \text{Served Days})$$

### 11.3 F&F Entity & Lifecycle
- Entity: `FnFSettlement`
  - Fields: `id`, `companyId`, `employeeId`, `resignationDate`, `lastWorkingDate`, `noticePeriodDays`, `servedDays`, `leaveEncashmentDays`, `leaveEncashmentAmount`, `gratuityAmount`, `noticeRecoveryAmount`, `pendingReimbursements`, `loanRecoveryAmount`, `netSettlementAmount`, `status` (`DRAFT`, `APPROVED`, `SETTLED`), `remarks`.
- Document: Generates an official multi-page **Full & Final Settlement Statement PDF**.

---

## 12. Enterprise Specification: Employee Loans, Salary Advances & Auto-EMI

### 12.1 Overview
Enables companies to extend emergency advances and salary loans to employees, automating repayment by deducting fixed EMIs during the monthly payroll run.

### 12.2 Loan Lifecycle & State Machine
1. `REQUESTED`: Employee submits loan amount, tenure in months, and emergency reason.
2. `APPROVED`: HR/Finance approves terms and disburses funds.
3. `ACTIVE`: Linked to payroll engine; automatically deducts EMI each month.
4. `CLOSED`: Principal fully recovered (outstanding balance = 0).

### 12.3 Payroll Integration Algorithm
During `PayrollCalculationService.calculateForEmployee()`:
1. Query active loans for the employee: `loanRepository.findByEmployeeIdAndStatus(empId, ACTIVE)`.
2. Determine monthly EMI: $\min(\text{Monthly EMI}, \text{Remaining Principal})$.
3. Check net pay safeguard: Total deductions (Statutory + EMI) must not exceed 75% of Gross Pay (payment of wages compliance).
4. Deduct EMI from Net Pay, create `LoanRepayment` record, and reduce `outstandingPrincipal`.

---

## 13. Enterprise Specification: Statutory Returns & Government Filing Exporters

### 13.1 EPFO Electronic Challan cum Return (ECR)
The Employees' Provident Fund Organisation (EPFO) requires a `#~#` delimited plain text file for monthly PF return submission.

#### ECR File Format (Columns delimited by `#~#`):
1. `UAN` (Universal Account Number - 12 digits)
2. `Member Name` (as registered with EPFO)
3. `Gross Wages` (Monthly gross salary)
4. `EPF Wages` (Basic salary capped at ₹15,000 for EPF)
5. `EPS Wages` (Pension wages capped at ₹15,000)
6. `EDLI Wages` (Deposit-linked insurance capped at ₹15,000)
7. `EE Share Remitted` (12% of EPF wages)
8. `EPS Contribution` (8.33% of EPS wages)
9. `ER Share Remitted` (3.67% of EPF wages = EE Share - EPS)
10. `NCP Days` (Non-contributing period / Unpaid leave days)
11. `Refund of Advances` (0.00 default)

### 13.2 ESIC Return of Contribution
For employees earning Gross Salary $\le$ ₹21,000/month:
- Employee Contribution: 0.75% of Gross.
- Employer Contribution: 3.25% of Gross.
- Export format: Monthly Excel/CSV for ESIC portal upload.

### 13.3 Quarterly TDS Form 24Q Annexure Export
- Generates data required for NSDL e-TDS return filing: Deductor TAN, PAN of employees, taxable income, and tax deducted.

---

## 14. Enterprise Specification: Income Tax Declarations (Form 12BB) & Regime Engine

### 14.1 Tax Regimes (Section 115BAC)
- **New Tax Regime (Default)**: Concessional tax slabs with zero chapter VI-A deductions.
- **Old Tax Regime**: Standard tax slabs with chapter VI-A deductions:
  - Section 80C: Maximum deduction of ₹1,50,000 (EPF, PPF, ELSS, Life Insurance).
  - Section 80D: Health insurance premium (up to ₹25,000 self/family + ₹50,000 senior parents).
  - Section 24: Home loan interest deduction (up to ₹2,00,000).
  - Section 10(13A): HRA exemption based on actual rent paid, city type (Metro 50% vs Non-Metro 40%), and basic salary.

### 14.2 Dynamic TDS Algorithm
- $\text{Estimated Annual Taxable Income} = (\text{Monthly Gross} \times 12) - \text{Standard Deduction (₹50,000/₹75,000)} - \text{Approved Declarations}$.
- Apply applicable tax slab rates + 4% Health & Education Cess.
- $\text{Monthly TDS} = \frac{\text{Total Annual Tax Liability} - \text{TDS Deducted to Date}}{\text{Remaining Months in Fiscal Year}}$.

---

## 15. Enterprise Specification: Variable Pay, Overtime & Bonus Engine

### 15.1 Additions & Deductions
- **Additions**:
  - Overtime Pay: $\frac{\text{Monthly Basic}}{26 \times 8} \times \text{Overtime Hours} \times \text{Multiplier (1.5x or 2.0x)}$.
  - Performance Bonus / Sales Incentives.
  - Festive Bonus (Diwali / Annual).
  - Arrears / Special Payouts.
- **Deductions**:
  - Unreturned equipment recovery / loss damage.
  - Salary advance ad-hoc recovery.
  - Notice recovery.

### 15.2 Ingestion Mechanisms
1. Direct modal entry in Payroll Run review screen.
2. Bulk CSV upload: `empCode, overtimeHours, bonusAmount, incentiveAmount, otherDeductions, remarks`.

---

## 16. Enterprise Specification: Password-Protected Email Payslip Distribution

### 16.1 Security & Encryption Standard
- OpenPDF standard 128-bit AES encryption:
  ```java
  pdfWriter.setEncryption(userPassword.getBytes(), ownerPassword.getBytes(), PdfWriter.ALLOW_PRINTING, PdfWriter.ENCRYPTION_AES_128);
  ```
- **Password Convention**: Uppercase first 4 letters of Employee Name + Date of Birth in DDMM format (e.g. `AARA1508`).

### 16.2 Asynchronous Batch Dispatching
- Asynchronous worker pool (`@Async` with thread pool executor) to dispatch 200–500 emails without locking the HTTP connection.
- Track email delivery status per record: `PENDING`, `SENT`, `FAILED`.

---

## 17. Enterprise Specification: Employee Expense Reimbursement Claims

### 17.1 Workflow
1. Employee submits claim: Date, Category (`TRAVEL`, `MEALS`, `BROADBAND`, `FUEL`, `OTHER`), Amount, Merchant, Description, Receipt URL.
2. Manager / HR review: Pending approval queue with Approve and Reject actions.
3. Once approved, the claim is automatically pulled into the upcoming payroll batch as a **non-taxable reimbursement payout**, disbursed alongside net pay, and rendered cleanly on the encrypted payslip.

### 17.2 Entity & Statuses
- Entity: `ExpenseClaim`
  - Fields: `id`, `companyId`, `employeeId`, `claimDate`, `category`, `amount`, `merchant`, `description`, `receiptUrl`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `DISBURSED`), `approvedAt`, `remarks`, `createdAt`.
- Enums:
  - `ExpenseCategory`: `TRAVEL`, `MEALS`, `BROADBAND`, `FUEL`, `OTHER`
  - `ExpenseClaimStatus`: `PENDING`, `APPROVED`, `REJECTED`, `DISBURSED`

### 17.3 REST API Contracts
- `POST /api/expenses/submit`: Submit a new claim with receipt and description.
- `GET /api/expenses/my`: Retrieve claim history for the authenticated employee.
- `GET /api/expenses/pending`: Retrieve pending approval queue for managers and company admins.
- `GET /api/expenses`: Retrieve all tenant expense claims.
- `PUT /api/expenses/{id}/approve`: Approve claim for upcoming payroll cycle.
- `PUT /api/expenses/{id}/reject`: Reject claim with optional remarks.


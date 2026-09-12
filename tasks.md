# PayrollPro SaaS — Execution Roadmap & Task Tracker

> **Convention:** Tasks are numbered by Phase (e.g., 1.1, 2.3).  
> **Dynamic Sub-Tasks:** If new requirements emerge during implementation, log them as lettered sub-tasks (e.g., 2.3A, 2.3B) under the parent task.  
> **Status Legend:** `[ ]` Not Started | `[/]` In Progress | `[x]` Completed | `[!]` Blocked

---

## Phase 1: Project Scaffolding & Authentication System

**Goal:** Build the React frontend shell with login flow first, then establish the Spring Boot backend with H2 database, JWT authentication, and role-based security. Wire them together and verify end-to-end.

**Development Approach:** Frontend-first — UI shell is built with mock data before the backend exists, enabling early UX validation.

- `[x]` **Task 1.1:** Initialize React frontend
  - Create Vite + React project in `frontend/`.
  - Install and configure Tailwind CSS 3.
  - Install React Router v6.
  - Create folder structure: `src/pages/`, `src/components/`, `src/context/`, `src/services/`.
  - Verify: `npm run dev` launches at `http://localhost:5173` with a blank Tailwind-styled page.

- `[x]` **Task 1.2:** Build login page & auth context (UI shell)
  - `AuthContext` with `useReducer`: stores `token`, `role`, `companyId`, `isAuthenticated`.
  - `api.js` service: Fetch wrapper with mock/stub responses for offline development.
  - `LoginPage.jsx`: Email + password form, calls mock login, stores token in context + localStorage.
  - Role-based route guard: `ProtectedRoute` component redirects unauthenticated users to `/login`.
  - Verify: Login with mock credentials. Confirm token is stored. Protected routes accessible without backend.

- `[x]` **Task 1.3:** Initialize Spring Boot project
  - Create Maven project with `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `h2`, `jjwt` dependencies in `pom.xml`.
  - Configure `application.properties` for H2, JPA auto-DDL, and server port 8080.
  - Verify: `mvn clean compile` succeeds with zero errors.

- `[x]` **Task 1.4:** Create Company entity (tenant root)
  - JPA entity: `Company` with fields: `id`, `name`, `registrationNumber`, `address`, `gstin`, `isActive`, `createdAt`.
  - Spring Data repository: `CompanyRepository`.
  - Verify: Application starts, H2 console shows `COMPANY` table at `http://localhost:8080/h2-console`.

- `[x]` **Task 1.5:** Create User entity & authentication DTOs
  - JPA entity: `User` with `id`, `companyId`, `email`, `passwordHash`, `role` (enum: SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE), `employeeId` (nullable), `isActive`.
  - DTOs: `LoginRequest(email, password)`, `RegisterRequest(companyName, adminEmail, password)`, `AuthResponse(token, role, companyId)`.
  - Repository: `UserRepository` with `findByEmail()`.

- `[x]` **Task 1.6:** Implement JWT utility and security filter
  - `JwtUtil` class: `generateToken(userId, companyId, role)`, `validateToken(token)`, `extractClaims(token)`.
  - `JwtAuthFilter` (extends `OncePerRequestFilter`): Extracts JWT from `Authorization: Bearer <token>` header, validates, sets `SecurityContextHolder`.
  - `SecurityConfig`: Configure filter chain — public endpoints (`/api/auth/**`), role-restricted endpoints.
  - `TenantContext`: Thread-local holder for `companyId` extracted from JWT.

- `[x]` **Task 1.7:** Build auth controller & wire frontend
  - `POST /api/auth/register`: Creates Company + first COMPANY_ADMIN user. Returns JWT.
  - `POST /api/auth/login`: Validates credentials, returns JWT with role and companyId.
  - Password hashing: BCryptPasswordEncoder.
  - Update `api.js` in frontend: Replace mock stubs with real API calls to `/api/auth/*` endpoints.
  - Configure Vite proxy: `/api` → `http://localhost:8080`.
  - Verify: Register and login via both curl and React UI. Confirm JWT is returned and stored.

- `[x]` **Task 1.8:** End-to-end auth smoke test
  - Register a company via API.
  - Login via React UI.
  - Confirm role-based route protection works (admin vs. employee vs. unauthenticated).
  - Document test results.

---

## Phase 2: Employee Management & Salary Configuration

**Goal:** Full CRUD for employees with salary structure configuration, seed data, and React employee directory.

- `[x]` **Task 2.1:** Create Employee entity
  - JPA entity with all fields from `specs.md` Section 5.3.
  - `companyId` as mandatory foreign key.
  - Status enum: `ACTIVE`, `ON_LEAVE`, `EXITED`.
  - Repository: `EmployeeRepository` with `findAllByCompanyId()`, `findByCompanyIdAndEmpCode()`.

- `[x]` **Task 2.2:** Create SalaryStructure entity
  - JPA entity with all fields from `specs.md` Section 5.4.
  - One-to-one relationship with Employee.
  - Auto-compute derived fields in service layer (basicSalary = 50% of monthlyGross, hra = 40% of basic, etc.).

- `[x]` **Task 2.3:** Employee CRUD REST API
  - `EmployeeController` with tenant-scoped endpoints:
    - `GET /api/employees` — paginated list (filtered by companyId from JWT).
    - `POST /api/employees` — create employee + auto-generate empCode (EMP-001, EMP-002...).
    - `PUT /api/employees/{id}` — update employee details.
    - `GET /api/employees/{id}` — single employee detail.
    - `DELETE /api/employees/{id}` — soft delete (set status to EXITED, set dateOfExit).
  - `EmployeeService` with business validation (duplicate email check, PAN format validation).
  - Verify: CRUD operations via curl/Postman. Confirm companyId isolation.

- `[x]` **Task 2.4:** Salary structure API
  - `GET /api/employees/{id}/salary` — returns current salary breakdown.
  - `POST /api/employees/{id}/salary` — creates or updates salary structure. Service auto-computes Basic, HRA, Special Allowance, EPF, PT from CTC input.
  - Verify: Set CTC = ₹12,00,000/year. Confirm Basic = ₹50,000, HRA = ₹20,000, Special = ₹30,000, EPF = ₹6,000.

- `[x]` **Task 2.5:** Seed data initializer
  - `DataInitializer` (`CommandLineRunner`): Pre-loads a demo company with 200 employees across 5 departments (Engineering, Marketing, Finance, Operations, HR).
  - Realistic salary ranges: ₹3,00,000 – ₹25,00,000 annual CTC.
  - Auto-generates empCodes, random Indian names, PAN numbers, bank details.
  - Verify: Application startup logs "200 employees seeded". API returns paginated list.

- `[x]` **Task 2.6:** React Employee Directory page
  - `EmployeeListPage.jsx`: TanStack Table with columns (Emp Code, Name, Department, Designation, Status).
  - Search bar (filter by name or empCode).
  - Pagination (20 per page).
  - "Add Employee" button opens modal/form.
  - Click row to view/edit employee details.
  - Verify: Load page. Confirm 200 employees render with sorting and pagination.

- `[x]` **Task 2.7:** React Employee Detail & Salary Form
  - `EmployeeDetailPage.jsx`: Displays personal info + current salary structure.
  - Edit form for CTC with auto-preview of computed breakdown (Basic, HRA, Special, EPF, PT).
  - Save button calls PUT salary API.
  - Verify: Edit CTC, save, confirm salary breakdown updates.

---

## Phase 3: Leave Management System

**Goal:** Leave types, balances, employee request submission, and manager approval workflow.

- `[x]` **Task 3.1:** Create LeaveType, LeaveBalance, LeaveRequest entities
  - JPA entities as per `specs.md` Sections 5.5, 5.6, 5.7.
  - LeaveRequest status enum: `PENDING`, `APPROVED`, `REJECTED`.
  - Repositories with tenant-scoped queries.

- `[x]` **Task 3.2:** Leave type & balance initialization service
  - When a company is registered, auto-create default leave types: CL (12/year), SL (6/year), EL (15/year).
  - When an employee is added, auto-create LeaveBalance records for current year with full quota.
  - `LeaveBalanceService`: `getRemainingBalance(employeeId, leaveTypeId, year)`.

- `[x]` **Task 3.3:** Leave request submission API (Employee)
  - `POST /api/leaves/request`: Employee submits leave (type, fromDate, toDate, reason).
  - Service validates: sufficient balance, no overlapping dates, fromDate <= toDate.
  - Auto-calculate `days` (business days between from and to, supports half-day with 0.5).
  - `GET /api/leaves/my-requests`: Returns own leave history.
  - `GET /api/leaves/my-balance`: Returns remaining balances per leave type.

- `[x]` **Task 3.4:** Leave approval API (Manager)
  - `GET /api/leaves/pending`: Returns pending requests for manager's department.
  - `PUT /api/leaves/{id}/approve`: Sets status to APPROVED, deducts from LeaveBalance.
  - `PUT /api/leaves/{id}/reject`: Sets status to REJECTED with remarks. No balance deduction.
  - Verify: Employee submits CL request → Manager sees in queue → Approves → Balance decreases.

- `[x]` **Task 3.5:** React Leave Module (Employee Portal)
  - `LeaveRequestForm.jsx`: Date range picker, leave type dropdown, reason textarea.
  - `LeaveHistoryPage.jsx`: Table of past requests with status badges (Pending/Approved/Rejected).
  - `LeaveBalanceCard.jsx`: Visual cards showing CL: 8/12 remaining, SL: 4/6, EL: 10/15.

- `[x]` **Task 3.6:** React Leave Approval Queue (Manager Portal)
  - `LeaveApprovalPage.jsx`: Table of pending requests with employee name, dates, type, reason.
  - Approve / Reject buttons with optional remarks modal.
  - Verify: Full flow end-to-end via UI.

---

## Phase 4: Attendance & Payroll Engine

**Goal:** Attendance logging (manual + CSV), batch payroll calculation, three-step approval, and payroll dashboard.

- `[x]` **Task 4.1:** Create Attendance entity & manual entry API
  - JPA entity as per `specs.md` Section 5.8.
  - `POST /api/attendance`: HR submits attendance for single employee (month, year, totalWorkingDays, presentDays, paidLeaveDays, unpaidLeaveDays).
  - Auto-compute `payableDays = totalWorkingDays - unpaidLeaveDays`.
  - Verify: Create attendance record. Confirm payableDays computation.

- `[x]` **Task 4.2:** CSV attendance upload
  - `POST /api/attendance/upload-csv`: Accepts multipart CSV file.
  - Expected CSV columns: `empCode, totalWorkingDays, presentDays, paidLeaves, unpaidLeaves`.
  - Parses and creates/updates Attendance records for the specified month.
  - Returns summary: `{processed: 195, errors: 5, errorDetails: [...]}`.
  - Verify: Upload a 200-row CSV. Confirm all records created.

- `[x]` **Task 4.3:** Create PayrollRun and PayrollRecord entities
  - JPA entities as per `specs.md` Sections 5.9 and 5.10.
  - PayrollRun status enum: `DRAFT`, `MANAGER_REVIEWED`, `APPROVED`, `LOCKED`.
  - Unique constraint: one PayrollRun per (companyId, month, year).

- `[x]` **Task 4.4:** Payroll calculation service
  - `PayrollCalculationService.calculateForEmployee(employee, salaryStructure, attendance)`:
    - Applies proration formula from `specs.md` Section 6.
    - Returns a populated `PayrollRecord` object.
  - Unit tests:
    - Full attendance (26/26 days) → full salary.
    - Partial attendance (20/26 days) → prorated earnings, full deductions.
    - Zero attendance → flag as anomaly.
    - High CTC (₹25L) → verify EPF cap logic.

- `[x]` **Task 4.5:** Batch payroll run endpoint
  - `POST /api/payroll/run?month=9&year=2026`:
    - Validates: attendance exists for all active employees.
    - Runs `calculateForEmployee()` for each employee in a single `@Transactional` block.
    - Creates PayrollRun (status: DRAFT) with aggregate totals.
    - Creates PayrollRecord for each employee.
    - Returns PayrollRun summary.
  - Verify: Trigger run for 200 employees. Confirm all records created. Measure execution time (target: < 3 seconds).

- `[x]` **Task 4.6:** Three-step payroll approval workflow
  - `PUT /api/payroll/runs/{id}/review` (MANAGER): Advances DRAFT → MANAGER_REVIEWED. Records reviewedBy, reviewedAt.
  - `PUT /api/payroll/runs/{id}/approve` (SUPER_ADMIN): Advances MANAGER_REVIEWED → APPROVED. Records approvedBy, approvedAt.
  - `PUT /api/payroll/runs/{id}/lock` (SUPER_ADMIN): Advances APPROVED → LOCKED. No further edits allowed.
  - State machine validation: reject invalid transitions (e.g., DRAFT → APPROVED directly).
  - Verify: Walk through all 4 states sequentially.

- `[x]` **Task 4.7:** React Payroll Dashboard
  - `PayrollRunPage.jsx`: "Select Month/Year" → "Run Payroll" button.
  - Progress indicator during batch processing.
  - Results table: Employee list with Gross, Deductions, Net Pay columns.
  - Status badge with action buttons (Review / Approve / Lock) based on current user's role.
  - Anomaly highlights: Red rows for negative net pay or zero attendance.

- `[x]` **Task 4.8:** React Attendance Management page
  - `AttendancePage.jsx`: Manual entry form + CSV upload dropzone.
  - Month/year selector.
  - Table showing attendance status per employee.

---

## Phase 5: PDF Payslip Generation & Employee Portal

**Goal:** Server-side payslip PDF generation and employee self-service experience.

- `[x]` **Task 5.1:** Add OpenPDF dependency and payslip service
  - Add `com.github.librepdf:openpdf:2.0.0` to `pom.xml`.
  - `PayslipPdfService.generatePayslip(PayrollRecord, Employee, SalaryStructure, Company)`:
    - Company header (name, address, GSTIN).
    - Employee details (name, empCode, department, PAN, bank account).
    - Earnings table (Basic, HRA, Special Allowance — with full and prorated amounts).
    - Deductions table (EPF, Professional Tax, TDS).
    - Net Pay in bold with amount in words (e.g., "Rupees Sixty-Five Thousand Four Hundred Only").
    - Payslip reference number and generation date.

- `[x]` **Task 5.2:** Payslip download endpoint
  - `GET /api/payslips/{recordId}/pdf`: Returns `application/pdf` response.
  - Access control: EMPLOYEE can download only own payslips. COMPANY_ADMIN can download any.
  - Verify: Download PDF. Open and inspect formatting, calculations, and layout.

- `[x]` **Task 5.3:** Employee self-service portal pages
  - `EmployeeDashboard.jsx`: Welcome card with name, department, designation.
  - `MyPayslipsPage.jsx`: Table of past payroll months with "Download PDF" button per row.
  - `MyLeavesPage.jsx`: Leave balances + request form + history (from Phase 3).
  - Navigation sidebar: Dashboard | My Payslips | Leave Management | Profile.
  - Verify: Login as EMPLOYEE role. Confirm only own data is visible. Download payslip PDF.

---

## Phase 6: AI Copilot (MCP Server)

**Goal:** Custom Model Context Protocol server exposing payroll tools to Claude Code and Antigravity.

- `[x]` **Task 6.1:** Initialize MCP server project
  - Create `mcp-server/` directory with `package.json` and `@modelcontextprotocol/sdk` dependency.
  - Scaffold `index.js` with Server initialization and stdio transport.
  - Verify: `node index.js` starts without errors.

- `[x]` **Task 6.2:** Implement payroll query tools
  - `get_payroll_summary(month, year)`: Calls backend API, returns aggregated payout summary.
  - `get_employee_details(empCode)`: Returns employee info + current salary structure.
  - `get_department_summary(department, month, year)`: Department-level aggregation.
  - `get_leave_balance(empCode)`: Returns remaining leave balances.

- `[x]` **Task 6.3:** Implement payroll audit tool
  - `audit_payroll_anomalies(month, year)`: Calls backend, analyzes all PayrollRecords for:
    - Negative net pay.
    - Zero attendance with no approved leave.
    - Missing bank IFSC or PAN.
    - Salary increase > 30% from previous month (potential data entry error).
  - Returns structured anomaly report with severity levels.

- `[x]` **Task 6.4:** Create CLAUDE.md and .antigravity/rules.md
  - `CLAUDE.md`: Project architecture, build/run commands, API map, coding standards.
  - `.antigravity/rules.md`: Architecture constraints, test requirements, commit standards.
  - Verify: Open Claude Code in project directory. Ask "What is this project?" — confirm it reads CLAUDE.md.

- `[x]` **Task 6.5:** End-to-end MCP test
  - Register MCP server with Claude Code: `claude mcp add payrollpro node <path>/mcp-server/index.js`.
  - Test prompts:
    - "Check the system health of our payroll backend."
    - "Audit September 2026 payroll for anomalies."
    - "What is the total payout for Engineering department this month?"
  - Verify: Claude calls MCP tools, receives data, provides intelligent analysis.

---

## Phase 7: Polish, Integration Testing & Delivery

**Goal:** Final testing, UI polish, documentation, and packaging for client delivery.

- `[x]` **Task 7.1:** Comprehensive unit test suite
  - Service tests: Payroll calculation edge cases (prorating, negative pay, EPF caps).
  - Controller tests: Role-based access validation (employee cannot access admin APIs).
  - Integration test: Full payroll cycle (seed data → attendance → run → approve → payslip).
  - Target: `mvn test` passes with 0 failures.

- `[x]` **Task 7.2:** Company registration & onboarding flow (React)
  - `RegisterPage.jsx`: Company name + admin email + password form.
  - On success, redirect to admin dashboard with onboarding tooltip.

- `[x]` **Task 7.3:** Admin dashboard analytics
  - Department-wise salary distribution chart (pie/bar chart).
  - Monthly payroll trend (line chart — last 6 months).
  - Quick stats: Total employees, Active, On Leave, Exited.

- `[x]` **Task 7.4:** Final README, deployment docs, and demo script
  - Complete `README.md` with setup, run, and demo instructions.
  - Interview demo walkthrough script.
  - Clean up unused files and console.logs.

- `[x]` **Task 7.5:** Package and move to Desktop
  - `mvn clean package -DskipTests` → verify JAR builds.
  - Copy project to `C:\Users\AKSHAY\Desktop\payrollpro\`.
  - Final smoke test from Desktop location.

---

## Phase 8: Bank Disbursal Batch Export Engine

**Goal:** Provide one-click generation of corporate internet banking batch upload files (HDFC CMS, ICICI CIB, Generic NEFT/RTGS CSV) for approved/locked payroll runs.

- `[x]` **Task 8.1:** Bank profile formatters & DTOs
  - Enum `BankDisbursalFormat`: `GENERIC_NEFT`, `HDFC_CMS`, `ICICI_CIB`.
  - Service `BankDisbursalService`: Generates CSV/pipe streams mapping `PayrollRecord`, `Employee`, and `SalaryStructure`.
- `[x]` **Task 8.2:** Pre-flight bank validation service
  - Validates employee IFSC codes (`^[A-Z]{4}0[A-Z0-9]{6}$`), numeric account numbers, and non-zero payouts.
  - Generates validation warning list for missing or invalid bank details.
- `[x]` **Task 8.3:** Disbursal export REST endpoints
  - `GET /api/payroll/runs/{id}/bank-export?format={format}`: Generates downloadable file.
  - `GET /api/payroll/runs/{id}/bank-validation`: Returns pre-flight validation status.
- `[x]` **Task 8.4:** React Bank Disbursal Export UI
  - Add "Export Bank Disbursal" modal to `PayrollRunPage.jsx`.
  - Bank selector dropdown (HDFC CMS / ICICI CIB / Standard NEFT).
  - Validation alert banner before allowing download.
- `[x]` **Task 8.5:** Unit & integration verification
  - Verify formatting across all 3 bank formats against sample bank specifications.

---

## Phase 9: Full & Final (F&F) Settlement & Gratuity Engine

**Goal:** Automate end-to-end exit settlements including statutory gratuity (Gratuity Act 1972), Earned Leave encashment, notice period recovery, and settlement PDF generation.

- `[x]` **Task 9.1:** Create FnFSettlement entity & repository
  - Entity `FnFSettlement`: employeeId, resignationDate, lastWorkingDate, noticePeriodDays, servedDays, leaveEncashmentAmount, gratuityAmount, noticeRecoveryAmount, netSettlementAmount, status (`DRAFT`, `APPROVED`, `SETTLED`).
  - Repository `FnFSettlementRepository`.
- `[x]` **Task 9.2:** Statutory calculation service
  - Implement Gratuity formula: `(15 * Last Drawn Basic * Completed Years) / 26` (tenure >= 5 years).
  - Implement EL Encashment: `(Basic / 26) * Remaining EL Balance`.
  - Notice shortfall adjustment calculation.
- `[x]` **Task 9.3:** F&F Settlement REST API
  - `POST /api/settlements/calculate/{employeeId}`: Computes preview settlement.
  - `POST /api/settlements`: Saves settlement record.
  - `PUT /api/settlements/{id}/approve`: Approves settlement.
  - `GET /api/settlements/{id}/statement-pdf`: Generates official settlement PDF.
- `[x]` **Task 9.4:** OpenPDF Settlement Statement generator
  - Multi-section official settlement statement with earnings, statutory deductions, recoveries, and net payout.
- `[x]` **Task 9.5:** React F&F Settlement UI
  - "Process Exit / F&F" action on `EmployeeDetailPage.jsx` and employee list.
  - Interactive settlement worksheet with auto-computed gratuity, leave encashment, and live preview.

---

## Phase 10: Employee Loans, Salary Advances & Auto-EMI Deduction

**Goal:** Enable employee emergency credit/advance requests and automate monthly EMI recovery during payroll processing.

- `[x]` **Task 10.1:** Create LoanRecord & LoanRepayment entities
  - `LoanRecord`: employeeId, principalAmount, tenureMonths, monthlyEmi, remainingPrincipal, status (`REQUESTED`, `APPROVED`, `ACTIVE`, `CLOSED`).
  - `LoanRepayment`: loanId, payrollRunId, amount, paymentDate.
- `[x]` **Task 10.2:** Loan application & approval REST API
  - `POST /api/loans/apply`: Employee submits loan request with amount & tenure.
  - `GET /api/loans/my-loans`: Employee views own loans and repayment schedule.
  - `GET /api/loans/pending`: Admin/Finance views pending loan requests.
  - `PUT /api/loans/{id}/approve`: Admin approves and activates loan.
- `[x]` **Task 10.3:** Auto-EMI deduction in payroll calculation
  - Update `PayrollCalculationService.java` to check for active loans and deduct EMI.
  - Safeguard: Total deductions capped at 75% of gross pay.
  - Create `LoanRepayment` record and update `LoanRecord.remainingPrincipal`.
- `[x]` **Task 10.4:** React Loans Portal & Admin Management
  - Employee portal: `MyLoansPage.jsx` with application form and repayment timeline.
  - Admin portal: `LoanManagementPage.jsx` for review and ledger tracking.

---

## Phase 11: Statutory Returns & Government Filing Exporters

**Goal:** Generate exact filing files required by EPFO and ESIC government portals.

- `[x]` **Task 11.1:** EPFO Electronic Challan cum Return (ECR) text generator
  - Service generating standard `#~#` delimited text file for direct EPFO portal upload.
  - Maps UAN, Gross Wages, EPF Wages (capped at ₹15,000), EE Share (12%), EPS (8.33%), ER Share (3.67%), and NCP Days.
- `[x]` **Task 11.2:** ESIC monthly contribution return exporter
  - Generates CSV/Excel report for gross wages <= ₹21,000 (0.75% employee + 3.25% employer).
- `[x]` **Task 11.3:** Statutory filings controller & download endpoints
  - `GET /api/statutory/epfo-ecr?payrollRunId={id}`: Downloads `#~#` text file.
  - `GET /api/statutory/esic-return?payrollRunId={id}`: Downloads ESIC CSV file.
- `[x]` **Task 11.4:** React Statutory Compliance Dashboard
  - Tab in Payroll dashboard for downloading EPFO ECR and ESIC returns with summary totals.

---

## Phase 12: Income Tax Declarations (Form 12BB) & Regime Engine

**Goal:** Employee tax regime selection (Old vs New Regime Section 115BAC), Form 12BB deduction submissions, and dynamic TDS recalculation.

- `[x]` **Task 12.1:** Create TaxDeclaration entity
  - Fields: employeeId, financialYear, regime (`NEW_REGIME`, `OLD_REGIME`), section80C, section80D, section24HomeLoan, annualRentPaid, status (`DRAFT`, `SUBMITTED`, `VERIFIED`).
- `[x]` **Task 12.2:** Dynamic TDS calculation engine
  - Annual income projection formula based on chosen regime and approved declarations.
  - Amortizes tax liability across remaining months in the financial year.
- `[x]` **Task 12.3:** Tax declaration REST API
  - `POST /api/tax/declaration`: Employee submits/updates declarations.
  - `GET /api/tax/declaration/my`: Employee retrieves active declaration.
  - `GET /api/tax/declarations/pending`: Admin reviews pending declarations.
  - `PUT /api/tax/declarations/{id}/verify`: Admin approves/adjusts declared amounts.
- `[x]` **Task 12.4:** React Tax Declaration Portal & Admin Verification
  - Employee: `TaxDeclarationPage.jsx` with Old vs New regime comparator calculator.
  - Admin: `TaxVerificationPage.jsx` for review and bulk approval.

---

## Phase 13: Variable Pay, Overtime & Bonus Engine

**Goal:** Support monthly variable compensation (overtime, performance bonuses, incentives, and ad-hoc penalties) without altering base CTC.

- `[x]` **Task 13.1:** Create VariablePayRecord entity & expand PayrollRecord
  - `VariablePayRecord`: employeeId, month, year, type (`OVERTIME`, `BONUS`, `INCENTIVE`, `DEDUCTION`), amount, remarks.
  - Expand `PayrollRecord`: `overtimePay`, `bonusAmount`, `otherAdditions`, `otherDeductions`.
- `[x]` **Task 13.2:** Calculation engine & CSV bulk upload
  - Update `PayrollCalculationService.java` to ingest variable pay into gross and net earnings.
  - Endpoint `POST /api/payroll/variable-pay/upload-csv`: Bulk imports monthly variable pay.
- `[x]` **Task 13.3:** Payslip PDF updates
  - Display itemized Overtime and Bonus in earnings table, and ad-hoc deductions in deductions table.
- `[x]` **Task 13.4:** React Variable Pay Manager
  - "Manage Variable Pay" modal in `PayrollRunPage.jsx` with CSV upload and manual entry table.

---

## Phase 14: Secure Password-Protected Email Payslip Distribution

**Goal:** Automatic asynchronous dispatch of encrypted PDF payslips directly to employee mailboxes upon payroll lock.

- `[x]` **Task 14.1:** OpenPDF AES-128 encryption
  - Add PDF password protection: First 4 uppercase letters of Name + DOB DDMM or PAN.
- `[x]` **Task 14.2:** Asynchronous email dispatch service
  - Add `spring-boot-starter-mail` and `@Async` thread-pool dispatcher.
  - Safe development mode: logs email payload when SMTP credentials are not configured.
- `[x]` **Task 14.3:** Email batch trigger & status API
  - `POST /api/payroll/runs/{id}/send-payslips`: Queues payslip emails for all employees.
  - `POST /api/payslips/{id}/send-email`: Resends payslip to single employee.
- `[x]` **Task 14.4:** React Email Dispatch UI
  - "Email All Payslips" action button on locked payroll runs.
  - Live toast feedback and delivery status indicator per employee row.

---

## Phase 15: Employee Expense Reimbursement Claims

**Goal:** Employee submission of non-taxable business expenses, receipt verification, and disbursal via payroll.

- `[x]` **Task 15.1:** Create ExpenseClaim entity
  - Fields: employeeId, claimDate, category (`TRAVEL`, `MEALS`, `BROADBAND`, `FUEL`, `OTHER`), amount, merchant, receiptUrl, status (`PENDING`, `APPROVED`, `REJECTED`, `DISBURSED`).
- `[x]` **Task 15.2:** Expense claims REST API
  - `POST /api/expenses/submit`: Employee submits claim with receipt.
  - `GET /api/expenses/my`: Employee views claim history.
  - `GET /api/expenses/pending`: Manager/Finance review queue.
  - `PUT /api/expenses/{id}/approve` & `PUT /api/expenses/{id}/reject`.
- `[x]` **Task 15.3:** Payroll payout integration
  - Automatically bundle approved expense claims into the current month's payroll batch as non-taxable reimbursements.
- `[x]` **Task 15.4:** React Expense Claims UI
  - Employee `EmployeeDashboard.jsx`: Claim submission modal with category, amount, merchant, receipt URL.
  - Interactive table of submitted claims with live status badges.


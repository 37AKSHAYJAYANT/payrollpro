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

## Future Enhancements (Post-Delivery Backlog)

- `[ ]` **Task F.1:** Bank disbursal CSV/Excel export (Apache POI).
- `[ ]` **Task F.2:** Email payslips to employees (JavaMail / SMTP).
- `[ ]` **Task F.3:** ESI (Employee State Insurance) calculation for applicable salary brackets.
- `[ ]` **Task F.4:** Annual Form 16 / Investment Declaration module.
- `[ ]` **Task F.5:** Overtime and bonus calculation module.
- `[ ]` **Task F.6:** Docker containerization for cloud deployment.

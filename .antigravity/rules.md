# Antigravity Rules for PayrollPro

## 1. Architectural Constraints
- **Lombok Prohibition**: Under no circumstances should Lombok annotations (`@Data`, `@Getter`, `@Setter`, `@Builder`, etc.) be introduced. Always write standard Java getters, setters, and constructors.
- **Tenant Context**: All database read and write operations must enforce multi-tenant separation using `TenantContext.getCompanyId()`.
- **Database Compatibility**: Do not use H2 2.x reserved keywords (`YEAR`, `MONTH`) as raw column names without custom mapping (e.g. use `record_year`, `record_month`, `leave_year`, `att_year`, `att_month`, `run_year`, `run_month`).

## 2. Payroll & Statutory Business Rules
- **Earnings Proration**: Prorated amounts must follow `(PayableDays / TotalWorkingDays) * SalaryComponent`.
- **Statutory Deductions**: EPF, PT, and TDS are flat statutory amounts unless regulated otherwise by Indian tax laws.
- **Payroll State Machine**: The 4 lifecycle states are `DRAFT` -> `MANAGER_REVIEWED` -> `APPROVED` -> `LOCKED`.
- **Locked Payroll Immutability**: Any payroll run in `LOCKED` state cannot be deleted or re-executed.

## 3. Testing & Verification Requirements
- All newly created or modified API endpoints must have end-to-end script verifications testing happy path, validation failures, and authorization boundaries.
- Frontend builds must pass `npm run build` with zero compiler warnings or errors.

## 4. Code Quality & Formatting
- Codebase paths should be referenced with github-style markdown links.
- Keep components modular and reusable.

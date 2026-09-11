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

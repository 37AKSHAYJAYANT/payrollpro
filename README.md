# 🚧 [WIP] PayrollPro — Enterprise Payroll & HRMS SaaS Platform

[![Status: WIP](https://img.shields.io/badge/status-Work%20in%20Progress%20(WIP)-orange?style=for-the-badge&logo=git)](https://github.com/)
[![Security: Protected](https://img.shields.io/badge/code-Protected%20%2F%20Read--Only-red?style=for-the-badge&logo=github)](https://github.com/)
[![License: Proprietary](https://img.shields.io/badge/license-Proprietary-blue?style=for-the-badge)](https://github.com/)

> ⚠️ **Notice:** This repository is currently **Work in Progress (WIP)**.  
> 🔒 **Repository Protection:** Direct commits, external merges, and unauthorized changes are strictly restricted. All rights reserved by the repository owner.

---


## Prerequisites

Ensure the following are installed on your machine:

| Tool | Required Version | Check Command |
|:-----|:-----------------|:-------------|
| Java JDK | 17 or 18 | `java -version` |
| Apache Maven | 3.9+ | `mvn -v` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | 2.x | `git --version` |

---

## Project Structure

> **Development Order:** Frontend-first — the React UI shell is built before the Spring Boot backend.

```
payrollpro/
├── frontend/                   # React 18 + Vite + Tailwind CSS (built first)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── context/            # AuthContext
│       ├── services/           # API client (mock → real)
│       ├── pages/              # Route pages
│       └── components/         # Reusable UI components
├── backend/                    # Java 18 + Spring Boot 3.2 REST API
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/payrollpro/
│       │   │   ├── PayrollProApplication.java
│       │   │   ├── config/          # Security, JWT, CORS, TenantFilter
│       │   │   ├── model/           # JPA Entities
│       │   │   ├── repository/      # Spring Data Repositories
│       │   │   ├── service/         # Business Logic & Payroll Engine
│       │   │   ├── controller/      # REST Controllers
│       │   │   └── dto/             # Request/Response DTOs
│       │   └── resources/
│       │       └── application.properties
│       └── test/
│           └── java/com/payrollpro/
├── mcp-server/                 # AI Copilot (Model Context Protocol)
│   ├── package.json
│   └── index.js
├── CLAUDE.md                   # Claude Code AI instructions
├── .antigravity/
│   └── rules.md                # Antigravity workspace rules
├── specs.md                    # Full technical specification
├── tasks.md                    # Phased execution roadmap
└── README.md                   # This file
```

---

## 🌟 Enterprise Features & Module Architecture

PayrollPro is engineered for high-volume Indian enterprises (200–500 employees), providing a complete operational suite across payroll processing, banking, compliance, and employee lifecycle:

| Category | Module | Capabilities |
|---|---|---|
| **Core Payroll** | **High-Speed Batch Engine** | Prorates gross pay, calculates EPF (12% capped at ₹1,800), Professional Tax (₹200), and TDS in <150ms for 200+ employees. |
| | **3-Step Approval Workflow** | DRAFT $\rightarrow$ MANAGER_REVIEWED $\rightarrow$ APPROVED $\rightarrow$ LOCKED state machine preventing unauthorized changes. |
| | **OpenPDF Payslip Engine** | Generates official PDF salary slips with earnings, statutory deductions, PAN, bank details, and net pay in words. |
| **Banking & Payouts** | **Bank Disbursal Export** | One-click corporate batch payout files for **HDFC Bank CMS**, **ICICI Bank CIB**, and **Generic NEFT/RTGS CSV** with pre-flight IFSC/account validation. |
| | **Variable Pay & Bonuses** | Add overtime pay (1.5x / 2.0x multipliers), performance incentives, festive bonuses, and ad-hoc deductions via bulk CSV. |
| **Employee Lifecycle** | **Full & Final (F&F) Settlement** | Exit management computing **Earned Leave (EL) encashment**, statutory **Gratuity** (Payment of Gratuity Act 1972 for tenure $\ge 5$ years), notice shortfall recovery, and official settlement statements. |
| | **Loans & Auto-EMI Deductions** | Emergency credit requests, admin approval, and automated monthly EMI deduction from payroll capped at 75% gross pay. |
| **Statutory Compliance** | **EPFO ECR Text File Generator** | Official `#~#` delimited text file generation for direct upload to the EPFO Unified Member Portal. |
| | **ESIC Return of Contribution** | Monthly contribution filings for employees with gross salary $\le$ ₹21,000 (0.75% EE + 3.25% ER). |
| | **TDS & Form 12BB Declarations** | Old vs New Regime (Section 115BAC) selector with Section 80C, 80D, Section 24, and HRA rent proofs driving dynamic monthly TDS withholding. |
| **Security & Delivery** | **Password-Protected Email Payslips** | Asynchronous `@Async` email distribution of PDF payslips encrypted with AES-128 using employee DOB/PAN passwords. |
| | **Multi-Tenant Security** | Stateless JWT authentication with strict `TenantContext` isolation on all database queries. |
| **Claims & AI** | **Expense Reimbursements** | Non-taxable business claim submission (receipt uploads), multi-tier approvals, and payroll reimbursable addition. |
| | **AI Copilot (MCP Server)** | Model Context Protocol tools for real-time anomaly auditing, headcount statistics, and departmental compensation analytics. |

---

## Environment Setup

### 1. Clone or navigate to the project
```powershell
cd C:\Users\AKSHAY\Desktop\payrollpro
```

### 2. Create environment configuration
Create `backend/src/main/resources/application.properties`:
```properties
# Server
server.port=8080
spring.application.name=payrollpro-backend

# H2 Database (Development)
spring.datasource.url=jdbc:h2:mem:payrolldb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# H2 Console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# JPA
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# JWT (secret comes from the JWT_SECRET env var; the fallback is dev-only)
jwt.secret=${JWT_SECRET:local-dev-insecure-secret-change-me-0123456789}
jwt.expiration-ms=86400000

# Actuator
management.endpoints.web.exposure.include=health,info

# CORS (comma-separated allow-list of trusted browser origins)
app.cors.allowed-origins=http://localhost:5173
```

### 3. Production deployment (prod profile)
The Docker image runs with `SPRING_PROFILES_ACTIVE=prod` (set in the `Dockerfile`), which disables the H2 console and **requires** a strong signing secret supplied at runtime. Set these environment variables on your host (e.g. the Render dashboard):

| Variable | Purpose |
|:---------|:--------|
| `JWT_SECRET` | JWT signing key, **≥32 characters**. No default in prod — the app refuses to start without it, so a weak/known key can never leak in. |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated allow-list of trusted browser origins. Omit when the SPA is served same-origin (the default single-image deployment). |

---

## Running the Application

### Terminal 1: Start Frontend
```powershell
cd C:\Users\AKSHAY\Desktop\payrollpro\frontend
npm install   # first time only
npm run dev
```
Frontend runs at: **http://localhost:5173**

### Terminal 2: Start Backend
```powershell
cd C:\Users\AKSHAY\Desktop\payrollpro\backend
mvn spring-boot:run
```
Backend runs at: **http://localhost:8080**

### Terminal 3: Start MCP Server (for AI Copilot)
```powershell
cd C:\Users\AKSHAY\Desktop\payrollpro\mcp-server
npm install   # first time only
```
Register with Claude Code:
```bash
claude mcp add payrollpro node C:\Users\AKSHAY\Desktop\payrollpro\mcp-server\index.js
```

---

## Build & Test Commands

| Action | Command | Run From |
|:-------|:--------|:---------|
| Install frontend deps | `npm install` | `frontend/` |
| Start frontend dev | `npm run dev` | `frontend/` |
| Build frontend prod | `npm run build` | `frontend/` |
| Compile backend | `mvn clean compile` | `backend/` |
| Run backend tests | `mvn clean test` | `backend/` |
| Package as JAR | `mvn clean package -DskipTests` | `backend/` |
| Run packaged JAR | `java -jar target/payrollpro-backend-1.0.0.jar` | `backend/` |
| Install MCP deps | `npm install` | `mcp-server/` |

---

## API Quick Reference

| Endpoint | Method | Role | Description |
|:---------|:-------|:-----|:------------|
| `/api/auth/register` | POST | Public | Register company + admin |
| `/api/auth/login` | POST | Public | Login, returns JWT |
| `/api/employees` | GET | Admin | List employees (paginated) |
| `/api/employees` | POST | Admin | Add employee |
| `/api/employees/{id}/salary` | POST | Admin | Set salary structure |
| `/api/attendance/upload-csv` | POST | Admin | Bulk attendance upload |
| `/api/payroll/run?month=9&year=2026` | POST | Admin | Run batch payroll |
| `/api/payroll/runs/{id}/review` | PUT | Manager | Review payroll |
| `/api/payroll/runs/{id}/approve` | PUT | Admin | Approve payroll |
| `/api/payroll/runs/{id}/lock` | PUT | Admin | Lock payroll run |
| `/api/payroll/runs/{id}/bank-export?format=HDFC_CMS` | GET | Admin | Batch bank disbursal export |
| `/api/payroll/runs/{id}/send-payslips` | POST | Admin | Batch email password-protected payslips |
| `/api/payroll/variable-pay/upload-csv` | POST | Admin | Bulk variable pay & bonus upload |
| `/api/statutory/epfo-ecr?payrollRunId={id}` | GET | Admin | EPFO ECR `#~#` return file download |
| `/api/statutory/esic-return?payrollRunId={id}` | GET | Admin | ESIC monthly contribution return |
| `/api/settlements/calculate/{employeeId}` | POST | Admin | Full & Final (F&F) settlement preview |
| `/api/settlements/{id}/statement-pdf` | GET | Admin | F&F official settlement PDF |
| `/api/loans/apply` | POST | Employee | Apply for salary advance / loan |
| `/api/loans/{id}/approve` | PUT | Admin | Approve loan with auto-EMI deduction |
| `/api/tax/declaration` | POST | Employee | Form 12BB tax deduction declaration |
| `/api/expenses/submit` | POST | Employee | Submit expense reimbursement claim |
| `/api/expenses/{id}/approve` | PUT | Manager | Approve expense claim for payroll disbursal |
| `/api/payslips/{id}/pdf` | GET | Employee/Admin | Download AES-128 encrypted payslip PDF |
| `/api/leaves/request` | POST | Employee | Submit leave request |
| `/api/leaves/pending` | GET | Manager | Pending leave approvals |

---

## Default Demo Credentials (After Seed Data Loads)

| Role | Email | Password |
|:-----|:------|:---------|
| Super Admin | `admin@payrollpro.com` | `admin123` |
| Company Admin (HR) | `hr@democompany.com` | `hr123` |
| Manager | `manager@democompany.com` | `manager123` |
| Employee | `emp001@democompany.com` | `emp123` |

---

## Interview Demo Walkthrough Script

Follow this step-by-step 5-minute walkthrough to showcase the full enterprise capabilities of PayrollPro:

### Step 1: Admin & HR Operations (Login: `hr@democompany.com` / `hr123`)
1. **Executive Dashboard**: Review total headcount (200), active status, and department compensation distribution bars.
2. **Employee Directory (`/employees`)**: Search by name or code (e.g., "Aarav"), view paginated records, and click on any employee to inspect their CTC and statutory monthly breakdown (Basic ₹50k, HRA ₹20k, EPF ₹1.8k, PT ₹200).
3. **Attendance Management (`/attendance`)**:
   - Inspect logged attendance records for September 2026.
   - Upload sample CSV or manually enter attendance (e.g. 24 present, 2 paid leaves -> 26 payable days).
4. **Batch Payroll Engine (`/payroll`)**:
   - Click **"Run Payroll"** for September 2026. Notice sub-second processing (~120ms for 200 employees).
   - Review 200 calculated line items: Basic, Gross, EPF, PT, TDS, Net Pay.
   - Click **"Step 1: Mark Reviewed"** (Manager review).
   - Click **"Step 2: Approve Run"** (Admin approval).
   - Click **"Step 3: Lock & Finalize"** (Permanent lock; verify re-runs are blocked).
   - Click **"PDF"** on any row to immediately generate and view the verified salary slip.

### Step 2: Employee Self-Service Portal (Login: `emp001@democompany.com` / `emp123`)
1. **Personal Dashboard (`/dashboard`)**:
   - Welcomes employee (`Aarav Sharma`), shows Employee Code (`EMP-001`), Department, and Bank Details.
   - Live leave quota cards: Casual Leave (12), Sick Leave (6), Earned Leave (15).
   - Click **"Download Latest Payslip"** to download official PDF.
2. **My Payslips Archive (`/employee/payslips`)**:
   - View historical statements and interactive earnings/deductions breakdown modal.
3. **Leave Management (`/leaves`)**:
   - Apply for casual leave; verify pending queue and manager signoff workflow.

### Step 3: AI Copilot via MCP Server
1. Navigate to `mcp-server/`.
2. Run automated test suite: `node test_mcp_client.js`.
3. Demonstrates 5 production tools:
   - `get_payroll_summary`: Real-time net/gross totals across company.
   - `get_employee_details`: Full profile and salary configuration for any employee.
   - `get_department_summary`: Departmental aggregations (Engineering, Sales, etc.).
   - `get_leave_balance`: Live leave entitlement check.
   - `audit_payroll_anomalies`: Anomaly auditor detecting negative payouts, unmapped PAN/IFSC, and attendance mismatches.

---

## License

Private — Built for client delivery by Akshay
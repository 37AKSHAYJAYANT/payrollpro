# PayrollPro SaaS — Assistant Guide & Architecture Reference

## Overview
**PayrollPro** is a multi-tenant, enterprise-grade Payroll & HRMS SaaS platform engineered for Indian enterprises (200–500 employees). It handles automated payroll calculations, statutory compliance (EPF, Professional Tax, TDS), attendance and leave management, PDF payslip generation, and AI-powered HR operations via a custom Model Context Protocol (MCP) server.

---

## Technology Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS 3, React Router v6, Lucide icons, Context API.
- **Backend**: Java 17/18, Spring Boot 3.2.5, Spring Security 6 (Stateless JWT), Spring Data JPA, Hibernate, JJWT 0.12.6, OpenPDF 2.0.0.
- **Database**: H2 (In-memory development with 200 pre-seeded employees), PostgreSQL ready.
- **AI Copilot**: Model Context Protocol (MCP) server (`mcp-server/`) powered by `@modelcontextprotocol/sdk`.

---

## Build & Run Commands

### Backend (Spring Boot)
```bash
cd backend
mvn clean compile           # Compile Java sources
mvn spring-boot:run         # Run backend server on port 8080
mvn test                    # Run test suite
```

### Frontend (React + Vite)
```bash
cd frontend
npm install                 # Install dependencies
npm run dev                 # Start Vite dev server on http://localhost:5173
npm run build               # Build production assets in dist/
```

### AI Copilot (MCP Server)
```bash
cd mcp-server
npm install                 # Install @modelcontextprotocol/sdk
npm start                   # Start MCP stdio server
```

---

## Key Credentials (Pre-Seeded Demo Data)
| Role | Email | Password | Scope |
|---|---|---|---|
| Super Admin | `admin@payrollpro.com` | `admin123` | Platform oversight & configuration |
| Company Admin (HR) | `hr@democompany.com` | `hr123` | Full HR operations, payroll, attendance |
| Department Manager | `manager@democompany.com` | `manager123` | Leave approvals, payroll step 1 review |
| Employee | `emp001@democompany.com` | `emp123` | Self-service payslips, leave requests |

---

## REST API Overview
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Employees**: `GET /api/employees`, `POST /api/employees`, `GET /api/employees/{id}`, `PUT /api/employees/{id}`
- **Salary Structures**: `GET /api/salary-structures/employee/{empId}`, `POST /api/salary-structures`
- **Leaves**: `GET /api/leaves/types`, `GET /api/leaves/my-balance`, `POST /api/leaves/request`, `GET /api/leaves/pending`, `PUT /api/leaves/{id}/approve`, `PUT /api/leaves/{id}/reject`, `GET /api/leaves/employee/{empId}/balance`
- **Attendance**: `POST /api/attendance`, `GET /api/attendance`, `POST /api/attendance/upload-csv`
- **Payroll**: `POST /api/payroll/run?month={m}&year={y}`, `GET /api/payroll/runs`, `GET /api/payroll/runs/{id}/records`, `PUT /api/payroll/runs/{id}/review`, `PUT /api/payroll/runs/{id}/approve`, `PUT /api/payroll/runs/{id}/lock`
- **Payslips**: `GET /api/payslips/{recordId}/pdf`, `GET /api/payslips/my`, `GET /api/payslips/employee/{empId}`

---

## Mandatory Coding Standards
1. **NO LOMBOK**: Never add or use Lombok in the backend. Always implement explicit getters, setters, and constructors.
2. **Tenant Isolation**: Every database interaction MUST be scoped to `TenantContext.getCompanyId()`.
3. **Statutory Rules (India)**:
   - Basic Salary = 50% of CTC
   - HRA = 40% of Basic Salary
   - EPF = 12% of Basic Salary (capped at ₹15,000 monthly wage ceiling = ₹1,800/mo)
   - Professional Tax = ₹200/mo
   - Net Pay = Gross Earnings - (EPF + PT + TDS)
4. **Approval Workflow**: DRAFT → MANAGER_REVIEWED → APPROVED → LOCKED (Locked payroll is immutable).

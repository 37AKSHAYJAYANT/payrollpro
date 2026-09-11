import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BACKEND_URL = process.env.PAYROLLPRO_API_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.PAYROLLPRO_ADMIN_EMAIL || "admin@payrollpro.com";
const ADMIN_PASSWORD = process.env.PAYROLLPRO_ADMIN_PASSWORD || "admin123";

let cachedToken = null;
let tokenExpiry = 0;

async function getAuthToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed with status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  cachedToken = data.token;
  // Cache for 23 hours
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

async function apiGet(endpoint) {
  const token = await getAuthToken();
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API GET ${endpoint} failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

// Create MCP Server
const server = new Server(
  {
    name: "payrollpro-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_payroll_summary",
        description: "Fetch high-level aggregate payout summary for a specified pay cycle month and year.",
        inputSchema: {
          type: "object",
          properties: {
            month: { type: "number", description: "Month number (1-12). Defaults to 9 (September)." },
            year: { type: "number", description: "Year (e.g. 2026). Defaults to 2026." },
          },
        },
      },
      {
        name: "get_employee_details",
        description: "Retrieve comprehensive details for an employee by employee code (e.g., EMP-001), including current salary structure and bank details.",
        inputSchema: {
          type: "object",
          properties: {
            empCode: { type: "string", description: "Employee code, e.g. EMP-001" },
          },
          required: ["empCode"],
        },
      },
      {
        name: "get_department_summary",
        description: "Aggregate payroll payout metrics (total employees, gross earnings, deductions, net payout, and averages) for a specific department.",
        inputSchema: {
          type: "object",
          properties: {
            department: { type: "string", description: "Department name (e.g. Engineering, Sales, Human Resources, Finance, Operations)" },
            month: { type: "number", description: "Pay cycle month (1-12). Defaults to 9." },
            year: { type: "number", description: "Pay cycle year (e.g. 2026). Defaults to 2026." },
          },
          required: ["department"],
        },
      },
      {
        name: "get_leave_balance",
        description: "Retrieve available and remaining leave balances (Casual Leave, Sick Leave, Earned Leave) for an employee.",
        inputSchema: {
          type: "object",
          properties: {
            empCode: { type: "string", description: "Employee code, e.g. EMP-001" },
            year: { type: "number", description: "Calendar year. Defaults to 2026." },
          },
          required: ["empCode"],
        },
      },
      {
        name: "audit_payroll_anomalies",
        description: "Audit payroll run line items for data anomalies: negative net pay, zero attendance, missing PAN or IFSC, and heavy deductions. Returns structured anomaly report with severity ratings.",
        inputSchema: {
          type: "object",
          properties: {
            month: { type: "number", description: "Pay cycle month (1-12). Defaults to 9." },
            year: { type: "number", description: "Pay cycle year (e.g. 2026). Defaults to 2026." },
          },
        },
      },
    ],
  };
});

// Tool Handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_payroll_summary") {
      const month = args?.month || 9;
      const year = args?.year || 2026;

      const runs = await apiGet("/api/payroll/runs");
      const matchedRun = runs.find((r) => r.month === month && r.year === year) || runs[0];

      if (!matchedRun) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ message: `No payroll run found for ${month}/${year}` }, null, 2),
            },
          ],
        };
      }

      const summary = {
        runId: matchedRun.id,
        month: matchedRun.month,
        year: matchedRun.year,
        status: matchedRun.status,
        employeeCount: matchedRun.employeeCount,
        totalGrossPay: matchedRun.totalGrossPay,
        totalGross: matchedRun.totalGrossPay,
        totalDeductions: matchedRun.totalDeductions,
        totalNetPay: matchedRun.totalNetPay,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    }

    if (name === "get_employee_details") {
      const code = (args?.empCode || "").trim().toUpperCase();
      const page = await apiGet(`/api/employees?size=500&search=${encodeURIComponent(code)}`);
      const employees = page.content || [];
      const employee = employees.find((e) => e.empCode.toUpperCase() === code);

      if (!employee) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Employee ${code} not found` }, null, 2) }],
        };
      }

      let salaryStructure = null;
      try {
        salaryStructure = await apiGet(`/api/employees/${employee.id}/salary`);
      } catch (err) {
        salaryStructure = { note: "Salary structure not configured yet" };
      }

      const result = {
        empCode: employee.empCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        designation: employee.designation,
        email: employee.email,
        phone: employee.phone,
        panNumber: employee.panNumber,
        bankName: employee.bankName,
        bankAccountNumber: employee.bankAccountNumber,
        ifscCode: employee.ifscCode,
        status: employee.status,
        dateOfJoining: employee.dateOfJoining,
        employee,
        salaryStructure,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "get_department_summary") {
      let deptQuery = (args?.department || "").trim().toLowerCase();
      if (deptQuery === "human resources" || deptQuery === "human-resources") {
        deptQuery = "hr";
      }
      const month = args?.month || 9;
      const year = args?.year || 2026;

      const runs = await apiGet("/api/payroll/runs");
      const targetRun = runs.find((r) => r.month === month && r.year === year) || runs[0];

      if (!targetRun) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `No payroll run found for ${month}/${year}` }, null, 2) }],
        };
      }

      const records = await apiGet(`/api/payroll/runs/${targetRun.id}/records`);
      const deptRecords = records.filter((r) => {
        if (!r.department) return false;
        const d = r.department.toLowerCase();
        return d === deptQuery || d.includes(deptQuery);
      });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNetPay = 0;

      deptRecords.forEach((r) => {
        totalGross += Number(r.grossEarned || 0);
        totalDeductions += Number(r.totalDeductions || 0);
        totalNetPay += Number(r.netPay || 0);
      });

      const count = deptRecords.length;
      const avgNet = count > 0 ? (totalNetPay / count).toFixed(2) : 0;

      const result = {
        department: args.department,
        month,
        year,
        runStatus: targetRun.status,
        employeeCount: count,
        totalGross: totalGross.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        totalNetPay: totalNetPay.toFixed(2),
        averageNetPay: avgNet,
        employeesSample: deptRecords.slice(0, 5).map((r) => ({
          empCode: r.empCode,
          name: r.employeeName,
          netPay: r.netPay,
        })),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === "get_leave_balance") {
      const code = (args?.empCode || "").trim().toUpperCase();
      const year = args?.year || 2026;

      const page = await apiGet(`/api/employees?size=500&search=${encodeURIComponent(code)}`);
      const employees = page.content || [];
      const employee = employees.find((e) => e.empCode.toUpperCase() === code);

      if (!employee) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Employee ${code} not found` }, null, 2) }],
        };
      }

      const balances = await apiGet(`/api/leaves/employee/${employee.id}/balance?year=${year}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                empCode: employee.empCode,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department,
                year,
                balances,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "audit_payroll_anomalies") {
      const month = args?.month || 9;
      const year = args?.year || 2026;

      const runs = await apiGet("/api/payroll/runs");
      const targetRun = runs.find((r) => r.month === month && r.year === year) || runs[0];

      if (!targetRun) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `No payroll run found for ${month}/${year}` }, null, 2) }],
        };
      }

      const records = await apiGet(`/api/payroll/runs/${targetRun.id}/records`);
      const empPage = await apiGet("/api/employees?size=500");
      const empMap = new Map((empPage.content || []).map((e) => [e.id, e]));

      const anomalies = [];

      for (const r of records) {
        const net = Number(r.netPay || 0);
        const gross = Number(r.grossEarned || 0);
        const payableDays = Number(r.payableDays || 0);
        const emp = empMap.get(r.employeeId);

        // 1. Negative net pay
        if (net < 0) {
          anomalies.push({
            empCode: r.empCode,
            employeeName: r.employeeName,
            issue: `Net pay is negative (-₹${Math.abs(net).toLocaleString('en-IN')})`,
            severity: "CRITICAL",
          });
        }

        // 2. Zero attendance
        if (payableDays === 0) {
          anomalies.push({
            empCode: r.empCode,
            employeeName: r.employeeName,
            issue: "Zero payable attendance logged — 100% loss of pay",
            severity: "MEDIUM",
          });
        }

        // 3. Missing PAN or IFSC
        if (emp) {
          if (!emp.panNumber || emp.panNumber.trim() === "") {
            anomalies.push({
              empCode: r.empCode,
              employeeName: r.employeeName,
              issue: "Missing PAN number for TDS statutory compliance",
              severity: "HIGH",
            });
          }
          if (!emp.ifscCode || emp.ifscCode.trim() === "") {
            anomalies.push({
              empCode: r.empCode,
              employeeName: r.employeeName,
              issue: "Missing bank IFSC code for salary disbursal",
              severity: "HIGH",
            });
          }
        }

        // 4. Excessive deductions (> 50% of gross)
        if (gross > 0 && (Number(r.totalDeductions || 0) / gross) > 0.5) {
          anomalies.push({
            empCode: r.empCode,
            employeeName: r.employeeName,
            issue: `High deduction ratio: ${( (Number(r.totalDeductions)/gross) * 100 ).toFixed(1)}% of gross`,
            severity: "LOW",
          });
        }
      }

      const criticalCount = anomalies.filter((a) => a.severity === "CRITICAL").length;
      const highCount = anomalies.filter((a) => a.severity === "HIGH").length;

      let recommendation = "All records appear compliant and ready for approval.";
      if (criticalCount > 0) {
        recommendation = `CRITICAL: Resolve ${criticalCount} negative payout issues immediately prior to manager review.`;
      } else if (highCount > 0) {
        recommendation = `ATTENTION: Complete missing statutory PAN/IFSC data for ${highCount} employees before bank transfer.`;
      }

      const report = {
        payCycle: `${month}/${year}`,
        runId: targetRun.id,
        runStatus: targetRun.status,
        totalRecordsAudited: records.length,
        totalAnomalies: anomalies.length,
        recommendation,
        anomalies,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error executing ${name}: ${error.message}` }],
    };
  }
});

// Run server with stdio transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PayrollPro MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error starting PayrollPro MCP Server:", error);
  process.exit(1);
});

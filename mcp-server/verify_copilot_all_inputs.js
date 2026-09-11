import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_URL = "http://localhost:8080";

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log("======================================================================");
  console.log("🔍 COMPREHENSIVE AI COPILOT VERIFICATION WITH ALL DEFINED INPUTS");
  console.log("======================================================================");

  // -------------------------------------------------------------
  // PART 1: Direct MCP Protocol Tools Testing (stdio Transport)
  // -------------------------------------------------------------
  console.log("\n📡 [PART 1] Connecting to MCP Server (stdio transport)...");
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(__dirname, "index.js")],
  });

  const client = new Client(
    { name: "copilot-verifier", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("  ✅ Successfully connected to MCP stdio server.\n");

  // Verify list of tools
  const toolList = await client.listTools();
  assert(toolList.tools.length === 5, `Expected exactly 5 MCP tools registered, found ${toolList.tools.length}`);
  const toolNames = toolList.tools.map((t) => t.name);
  console.log(`  Registered tools: ${toolNames.join(", ")}`);

  // -------------------------------------------------------------
  // Tool 1: get_payroll_summary
  // -------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("🧪 TEST SUITE: Tool 1 - get_payroll_summary");
  console.log("----------------------------------------------------------------------");

  console.log("Input: { month: 9, year: 2026 }");
  const summaryRes = await client.callTool({
    name: "get_payroll_summary",
    arguments: { month: 9, year: 2026 },
  });
  const summary = JSON.parse(summaryRes.content[0].text);
  console.log("Output received:", JSON.stringify(summary, null, 2));

  assert(summary.month === 9, `Month must be 9, got ${summary.month}`);
  assert(summary.year === 2026, `Year must be 2026, got ${summary.year}`);
  assert(summary.employeeCount === 200, `Employee count must be 200, got ${summary.employeeCount}`);
  assert(Number(summary.totalGrossPay) > 20000000, `Total Gross Pay must be > ₹2.0 Cr, got ₹${summary.totalGrossPay}`);
  assert(Number(summary.totalNetPay) > 19000000, `Total Net Pay must be > ₹1.9 Cr, got ₹${summary.totalNetPay}`);
  assert(Number(summary.totalDeductions) > 1000000, `Total Deductions must be > ₹10 Lakhs, got ₹${summary.totalDeductions}`);
  assert(
    Math.abs(Number(summary.totalGrossPay) - (Number(summary.totalNetPay) + Number(summary.totalDeductions))) < 5,
    "Mathematical identity check: Gross Pay == Net Pay + Total Deductions (within rounding)"
  );
  assert(["DRAFT", "MANAGER_REVIEWED", "APPROVED", "LOCKED"].includes(summary.status), `Status must be a valid state enum, got: ${summary.status}`);

  // -------------------------------------------------------------
  // Tool 2: get_employee_details
  // -------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("🧪 TEST SUITE: Tool 2 - get_employee_details");
  console.log("----------------------------------------------------------------------");

  console.log("Input: { empCode: 'EMP-001' }");
  const empRes1 = await client.callTool({
    name: "get_employee_details",
    arguments: { empCode: "EMP-001" },
  });
  const emp1 = JSON.parse(empRes1.content[0].text);
  console.log(`Output: Employee ${emp1.empCode} - ${emp1.firstName} ${emp1.lastName}, Dept: ${emp1.department}`);

  assert(emp1.empCode === "EMP-001", `Employee code must match EMP-001, got ${emp1.empCode}`);
  assert(emp1.firstName && emp1.lastName, `Employee name must be populated: ${emp1.firstName} ${emp1.lastName}`);
  assert(emp1.department === "Engineering", `EMP-001 department must be Engineering, got ${emp1.department}`);
  assert(emp1.salaryStructure !== null, "Salary structure must be populated for EMP-001");
  assert(Number(emp1.salaryStructure.annualCTC) > 0, `Annual CTC must be > 0, got ₹${emp1.salaryStructure.annualCTC}`);
  assert(
    Math.abs(Number(emp1.salaryStructure.basicSalary) - Number(emp1.salaryStructure.monthlyGross * 0.5)) < 0.05,
    "Basic salary must be 50% of Monthly Gross CTC per specs (within 1 paisa rounding)"
  );
  assert(
    Number(emp1.salaryStructure.hra) === Number((emp1.salaryStructure.basicSalary * 0.4).toFixed(2)),
    "HRA must be exactly 40% of Basic Salary per specs"
  );

  // Edge case: Non-existent employee
  console.log("\nInput (Edge Case): { empCode: 'EMP-9999' }");
  const empResInvalid = await client.callTool({
    name: "get_employee_details",
    arguments: { empCode: "EMP-9999" },
  });
  const empInvalid = JSON.parse(empResInvalid.content[0].text);
  assert(empInvalid.error && empInvalid.error.includes("not found"), `Should return friendly 'not found' error for invalid code`);

  // -------------------------------------------------------------
  // Tool 3: get_department_summary
  // -------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("🧪 TEST SUITE: Tool 3 - get_department_summary");
  console.log("----------------------------------------------------------------------");

  const depts = ["Engineering", "Marketing", "Finance", "Human Resources", "Operations"];
  let totalDeptHeadcount = 0;

  for (const dept of depts) {
    console.log(`Input: { department: '${dept}', month: 9, year: 2026 }`);
    const deptRes = await client.callTool({
      name: "get_department_summary",
      arguments: { department: dept, month: 9, year: 2026 },
    });
    const d = JSON.parse(deptRes.content[0].text);

    assert(d.employeeCount === 40, `${dept} department headcount must be 40, got ${d.employeeCount}`);
    assert(Number(d.totalGross) > 0, `${dept} total gross must be > 0, got ₹${d.totalGross}`);
    assert(Number(d.totalNetPay) > 0, `${dept} total net pay must be > 0, got ₹${d.totalNetPay}`);
    assert(Number(d.averageNetPay) > 0, `${dept} average net pay must be > 0, got ₹${d.averageNetPay}`);

    // Verify mathematical accuracy of average
    const calculatedAvg = Number((Number(d.totalNetPay) / d.employeeCount).toFixed(2));
    assert(
      Math.abs(calculatedAvg - Number(d.averageNetPay)) < 0.05,
      `${dept} average net pay calculation must be mathematically accurate`
    );

    totalDeptHeadcount += d.employeeCount;
  }

  assert(totalDeptHeadcount === 200, `Sum of departmental headcounts must equal total 200 employees, got ${totalDeptHeadcount}`);

  // -------------------------------------------------------------
  // Tool 4: get_leave_balance
  // -------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("🧪 TEST SUITE: Tool 4 - get_leave_balance");
  console.log("----------------------------------------------------------------------");

  console.log("Input: { empCode: 'EMP-001', year: 2026 }");
  const leaveRes = await client.callTool({
    name: "get_leave_balance",
    arguments: { empCode: "EMP-001", year: 2026 },
  });
  const leaveData = JSON.parse(leaveRes.content[0].text);
  console.log(`Output for ${leaveData.empCode}:`, JSON.stringify(leaveData.balances, null, 2));

  assert(leaveData.empCode === "EMP-001", `Employee code must match EMP-001`);
  assert(Array.isArray(leaveData.balances), `Balances must be an array`);
  assert(leaveData.balances.length >= 3, `Must have at least 3 statutory leave balances (CL, SL, EL), found ${leaveData.balances.length}`);

  const leaveCodes = leaveData.balances.map((b) => b.leaveTypeCode);
  assert(leaveCodes.includes("CL"), `Must contain Casual Leave (CL)`);
  assert(leaveCodes.includes("SL"), `Must contain Sick Leave (SL)`);
  assert(leaveCodes.includes("EL"), `Must contain Earned Leave (EL)`);

  leaveData.balances.forEach((b) => {
    assert(
      Number(b.remaining) === Number(b.totalBalance) - Number(b.used),
      `${b.leaveTypeName} remaining balance (${b.remaining}) must equal total (${b.totalBalance}) - used (${b.used})`
    );
  });

  // -------------------------------------------------------------
  // Tool 5: audit_payroll_anomalies
  // -------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("🧪 TEST SUITE: Tool 5 - audit_payroll_anomalies");
  console.log("----------------------------------------------------------------------");

  console.log("Input: { month: 9, year: 2026 }");
  const auditRes = await client.callTool({
    name: "audit_payroll_anomalies",
    arguments: { month: 9, year: 2026 },
  });
  const auditData = JSON.parse(auditRes.content[0].text);
  console.log(`Output: Total records audited: ${auditData.totalRecordsAudited}`);
  console.log(`Anomalies flagged: ${auditData.totalAnomalies}`);
  if (auditData.anomalies.length > 0) {
    console.log("Sample anomaly flagged:", JSON.stringify(auditData.anomalies[0], null, 2));
  }

  assert(auditData.totalRecordsAudited === 200, `Audited all 200 employee records, got ${auditData.totalRecordsAudited}`);
  assert(auditData.runStatus !== undefined, `Run status must be present in audit: ${auditData.runStatus}`);
  assert(Array.isArray(auditData.anomalies), `Anomalies field must be an array`);
  assert(auditData.recommendation !== undefined, `Recommendation must be provided`);

  // Verify anomaly structure
  if (auditData.anomalies.length > 0) {
    const firstAnomaly = auditData.anomalies[0];
    assert(["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(firstAnomaly.severity), `Anomaly severity must be valid enum: ${firstAnomaly.severity}`);
    assert(firstAnomaly.empCode !== undefined, `Anomaly must specify empCode`);
    assert(firstAnomaly.issue !== undefined, `Anomaly must describe the issue`);
  }

  await client.close();

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n======================================================================");
  console.log(`🏁 COPILOT TEST SUITE COMPLETED`);
  console.log(`   Total Assertions: ${testCount}`);
  console.log(`   Passed:           ${passedCount}`);
  console.log(`   Failed:           ${failedCount}`);
  console.log("======================================================================");

  if (failedCount > 0) {
    console.error("❌ Some copilot assertions failed!");
    process.exit(1);
  } else {
    console.log("🎉 ALL DEFINED COPILOT INPUTS PRODUCED 100% ACCURATE RESULTS!");
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Fatal test failure:", err);
  process.exit(1);
});

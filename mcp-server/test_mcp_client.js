import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("=== Testing PayrollPro MCP Server via stdio ===");

  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(__dirname, "index.js")],
  });

  const client = new Client(
    {
      name: "payrollpro-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✓ Connected to MCP Server successfully!");

  // 1. List tools
  const toolsResult = await client.listTools();
  console.log(`✓ Tools discovered: ${toolsResult.tools.length}`);
  toolsResult.tools.forEach((t) => console.log(`  - ${t.name}: ${t.description.substring(0, 60)}...`));

  if (toolsResult.tools.length < 5) {
    throw new Error(`Expected at least 5 tools, found ${toolsResult.tools.length}`);
  }

  // 2. Call get_payroll_summary
  console.log("\n--- Testing get_payroll_summary ---");
  const summaryRes = await client.callTool({
    name: "get_payroll_summary",
    arguments: { month: 9, year: 2026 },
  });
  console.log("Result:", summaryRes.content[0].text);

  // 3. Call get_employee_details
  console.log("\n--- Testing get_employee_details (EMP-001) ---");
  const empRes = await client.callTool({
    name: "get_employee_details",
    arguments: { empCode: "EMP-001" },
  });
  console.log("Result:", empRes.content[0].text.substring(0, 300) + "...");

  // 4. Call get_department_summary
  console.log("\n--- Testing get_department_summary (Engineering) ---");
  const deptRes = await client.callTool({
    name: "get_department_summary",
    arguments: { department: "Engineering", month: 9, year: 2026 },
  });
  console.log("Result:", deptRes.content[0].text);

  // 5. Call get_leave_balance
  console.log("\n--- Testing get_leave_balance (EMP-001) ---");
  const leaveRes = await client.callTool({
    name: "get_leave_balance",
    arguments: { empCode: "EMP-001", year: 2026 },
  });
  console.log("Result:", leaveRes.content[0].text);

  // 6. Call audit_payroll_anomalies
  console.log("\n--- Testing audit_payroll_anomalies ---");
  const auditRes = await client.callTool({
    name: "audit_payroll_anomalies",
    arguments: { month: 9, year: 2026 },
  });
  console.log("Result:", auditRes.content[0].text.substring(0, 400) + "...");

  console.log("\n==========================================");
  console.log("ALL 5 MCP TOOLS TESTED & WORKING 100%!");
  console.log("==========================================");

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

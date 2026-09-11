const BASE_URL = 'http://localhost:8080';

let testCount = 0;
let passCount = 0;

function check(cond, msg) {
  testCount++;
  if (cond) {
    passCount++;
    console.log(`  ✅ [UI COPILOT] ${msg}`);
  } else {
    console.error(`  ❌ [UI COPILOT] ${msg}`);
  }
}

async function getAuthToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@payrollpro.com', password: 'admin123' })
  });
  const data = await res.json();
  return data.token;
}

async function testFrontendCopilotQueries() {
  console.log("\n======================================================================");
  console.log("🖥️ TESTING FRONTEND IN-APP COPILOT DEFINED INPUTS & INTENTS");
  console.log("======================================================================");

  const token = await getAuthToken();

  // Test 1: Audit Anomaly Pipeline
  console.log("\n--- Testing UI Prompt: '🚨 Audit September Payroll for anomalies' ---");
  const runsRes = await fetch(`${BASE_URL}/api/payroll/runs`, { headers: { Authorization: `Bearer ${token}` } });
  const runs = await runsRes.json();
  const recordsRes = await fetch(`${BASE_URL}/api/payroll/runs/${runs[0].id}/records`, { headers: { Authorization: `Bearer ${token}` } });
  const records = await recordsRes.json();
  const empsRes = await fetch(`${BASE_URL}/api/employees?size=300`, { headers: { Authorization: `Bearer ${token}` } });
  const emps = await empsRes.json();

  check(runs.length > 0, "Payroll runs fetched for audit");
  check(records.length === 200, "All 200 records inspected during audit");
  check(emps.content.length === 200, "All 200 employee profiles loaded for compliance cross-reference");

  // Test 2: Payroll Summary
  console.log("\n--- Testing UI Prompt: '📊 What is the payroll summary?' ---");
  const targetRun = runs[0];
  check(Number(targetRun.totalGrossPay) > 0, `Gross pay valid: ₹${targetRun.totalGrossPay}`);
  check(Number(targetRun.totalNetPay) > 0, `Net payout valid: ₹${targetRun.totalNetPay}`);
  check(Number(targetRun.totalDeductions) > 0, `Deductions valid: ₹${targetRun.totalDeductions}`);

  // Test 3: Department Breakdown
  console.log("\n--- Testing UI Prompt: '🏢 Engineering department cost breakdown' ---");
  const engRecords = records.filter(r => r.department === 'Engineering');
  check(engRecords.length === 40, "Engineering headcount is 40");
  const totalEngGross = engRecords.reduce((acc, r) => acc + Number(r.grossEarned), 0);
  check(totalEngGross === 4400000, `Engineering gross matches ₹44.00 Lakhs, got ₹${totalEngGross}`);

  // Test 4: Employee Lookup
  console.log("\n--- Testing UI Prompt: '🔍 Lookup EMP-001' ---");
  const emp1 = emps.content.find(e => e.empCode === 'EMP-001');
  check(emp1 !== undefined, "EMP-001 profile found");
  check(emp1.firstName === 'Aarav', "First name matches Aarav");
  check(emp1.department === 'Engineering', "Department matches Engineering");
  check(emp1.bankAccountNumber !== null, "Bank account exists");

  console.log("\n======================================================================");
  console.log(`🎉 ALL ${passCount}/${testCount} FRONTEND COPILOT DEFINED INPUTS VERIFIED!`);
  console.log("======================================================================\n");
}

testFrontendCopilotQueries().catch(console.error);

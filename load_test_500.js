import http from 'http';

const BASE_URL = 'http://localhost:8080';
const CONCURRENT_USERS = 500;

// HTTP Agent with pooling
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 600,
  maxFreeSockets: 100,
  timeout: 30000,
});

async function getAuthToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@payrollpro.com', password: 'admin123' })
  });
  if (!res.ok) throw new Error(`Auth failed with status ${res.status}`);
  const data = await res.json();
  return data.token;
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const avg = (sum / latencies.length).toFixed(2);
  const p = (pct) => latencies[Math.min(Math.floor((pct / 100) * latencies.length), latencies.length - 1)];

  return {
    min: latencies[0].toFixed(2),
    max: latencies[latencies.length - 1].toFixed(2),
    avg,
    p50: p(50).toFixed(2),
    p90: p(90).toFixed(2),
    p95: p(95).toFixed(2),
    p99: p(99).toFixed(2)
  };
}

async function runConcurrentBurst(name, requestFn, count = CONCURRENT_USERS) {
  console.log(`\n===============================================================`);
  console.log(`🚀 [TEST] ${name}`);
  console.log(`⚡ Sending ${count} simultaneous requests (Concurrency = ${count})...`);
  console.log(`===============================================================`);

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < count; i++) {
    promises.push(
      (async () => {
        const reqStart = performance.now();
        try {
          const res = await requestFn(i);
          const reqDuration = performance.now() - reqStart;
          return { status: res.status, ok: res.ok, duration: reqDuration };
        } catch (err) {
          const reqDuration = performance.now() - reqStart;
          return { status: 0, ok: false, error: err.message, duration: reqDuration };
        }
      })()
    );
  }

  const results = await Promise.all(promises);
  const totalElapsed = (Date.now() - startTime) / 1000;

  const successful = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const latencies = results.map((r) => r.duration);
  const stats = calculatePercentiles(latencies);
  const rps = (count / totalElapsed).toFixed(2);

  console.log(`\n📊 RESULTS FOR: ${name}`);
  console.log(`---------------------------------------------------------------`);
  console.log(`  • Total Requests Sent:   ${count}`);
  console.log(`  • Concurrent Connections: ${count}`);
  console.log(`  • Successful (2xx OK):   ${successful.length} (${((successful.length / count) * 100).toFixed(1)}%)`);
  console.log(`  • Failed / Errors:       ${failed.length} (${((failed.length / count) * 100).toFixed(1)}%)`);
  if (failed.length > 0) {
    const errorSample = failed.slice(0, 3).map(f => f.error || `HTTP ${f.status}`).join(', ');
    console.log(`    ↳ Failure Details:     ${errorSample}`);
  }
  console.log(`  • Total Burst Time:      ${totalElapsed.toFixed(3)} seconds`);
  console.log(`  • Throughput:            ${rps} Requests/Sec (RPS)`);
  console.log(`---------------------------------------------------------------`);
  console.log(`  • Latency Distribution:`);
  console.log(`    - Min:     ${stats.min} ms`);
  console.log(`    - Median:  ${stats.p50} ms`);
  console.log(`    - Average: ${stats.avg} ms`);
  console.log(`    - P90:     ${stats.p90} ms`);
  console.log(`    - P95:     ${stats.p95} ms`);
  console.log(`    - P99:     ${stats.p99} ms`);
  console.log(`    - Max:     ${stats.max} ms`);
  console.log(`---------------------------------------------------------------`);

  return { name, count, successful: successful.length, failed: failed.length, stats, rps, totalElapsed };
}

async function main() {
  console.log(`****************************************************************`);
  console.log(`  PAYROLLPRO SAAS — 500 CONCURRENT USERS PEAK LOAD TEST SUITE  `);
  console.log(`  Target Backend: ${BASE_URL}`);
  console.log(`  Peak Concurrency: ${CONCURRENT_USERS} simultaneous users`);
  console.log(`****************************************************************`);

  // Step 1: Pre-authenticate to get token
  console.log(`\n🔑 Authenticating test agent...`);
  const token = await getAuthToken();
  console.log(`✅ Token obtained successfully.`);

  const allResults = [];

  // -------------------------------------------------------------
  // Test 1: 500 Concurrent Users Loading Health / Status Endpoint
  // -------------------------------------------------------------
  const t1 = await runConcurrentBurst('500 Users: Actuator Health Probe', async () => {
    return fetch(`${BASE_URL}/actuator/health`, { agent });
  });
  allResults.push(t1);

  // -------------------------------------------------------------
  // Test 2: 500 Concurrent Users Accessing Employee Directory (Authenticated)
  // -------------------------------------------------------------
  const t2 = await runConcurrentBurst('500 Users: Employee Directory API (GET /api/employees)', async () => {
    return fetch(`${BASE_URL}/api/employees?page=0&size=20`, {
      agent,
      headers: { Authorization: `Bearer ${token}` }
    });
  });
  allResults.push(t2);

  // -------------------------------------------------------------
  // Test 3: 500 Concurrent Users Accessing Payroll Runs (Authenticated)
  // -------------------------------------------------------------
  const t3 = await runConcurrentBurst('500 Users: Payroll Batches API (GET /api/payroll/runs)', async () => {
    return fetch(`${BASE_URL}/api/payroll/runs`, {
      agent,
      headers: { Authorization: `Bearer ${token}` }
    });
  });
  allResults.push(t3);

  // -------------------------------------------------------------
  // Test 4: 500 Concurrent Users Mixed Realistic Traffic (Portal Access)
  // -------------------------------------------------------------
  const endpoints = [
    { url: '/api/employees?page=0&size=10', name: 'Employee List' },
    { url: '/api/payroll/runs', name: 'Payroll History' },
    { url: '/api/leaves/types', name: 'Leave Types' },
    { url: '/actuator/health', name: 'System Health' }
  ];

  const t4 = await runConcurrentBurst('500 Users: Mixed Portal Traffic (Concurrent Multi-Endpoint)', async (i) => {
    const ep = endpoints[i % endpoints.length];
    return fetch(`${BASE_URL}${ep.url}`, {
      agent,
      headers: { Authorization: `Bearer ${token}` }
    });
  });
  allResults.push(t4);

  // -------------------------------------------------------------
  // Test 5: 500 Simultaneous Logins (BCrypt Password Hashing Stress)
  // -------------------------------------------------------------
  const t5 = await runConcurrentBurst('500 Users: Simultaneous Portal Logins (POST /api/auth/login)', async () => {
    return fetch(`${BASE_URL}/api/auth/login`, {
      agent,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@payrollpro.com', password: 'admin123' })
    });
  });
  allResults.push(t5);

  console.log(`\n===============================================================`);
  console.log(`🏆 FINAL 500 CONCURRENT USERS LOAD TEST SUMMARY`);
  console.log(`===============================================================`);
  console.table(
    allResults.map((r) => ({
      Scenario: r.name,
      Users: r.count,
      Success: `${r.successful}/${r.count}`,
      'Avg Latency': `${r.stats.avg} ms`,
      'P95 Latency': `${r.stats.p95} ms`,
      'Max Latency': `${r.stats.max} ms`,
      Throughput: `${r.rps} req/s`
    }))
  );
}

main().catch((err) => {
  console.error(`❌ Load test aborted:`, err);
  process.exit(1);
});

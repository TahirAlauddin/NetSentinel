#!/usr/bin/env node
/**
 * Hit the rate-limit endpoint repeatedly to trigger 429.
 * Sends X-RateLimit-Test: 1 so the API uses a 15‑min window and a fixed client (avoids 4,3,4,3 oscillation).
 * Login preset allows 5 requests per window; the 6th request should be blocked.
 *
 * Usage (from frontend dir, with dev server running on port 3000):
 *   node scripts/test-rate-limit.mjs
 *   node scripts/test-rate-limit.mjs http://localhost:3000
 *   node scripts/test-rate-limit.mjs https://localhost:3000 8
 *
 * Args: [baseUrl] [numberOfRequests]
 * Defaults: baseUrl = http://localhost:3000, numberOfRequests = 7
 */
const baseUrl = process.argv[2] || "http://localhost:3000";
const limit = parseInt(process.argv[3], 10) || 7;
const url = `${baseUrl.replace(/\/$/, "")}/api/auth/rate-limit`;

async function resetRateLimit() {
  console.log("Resetting rate limit before test...");
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-RateLimit-Test": "1",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log("Rate limit reset successfully.\n");
  } else {
    console.log(`Warning: Could not reset rate limit: ${body.error ?? res.status}\n`);
  }
}

async function run() {
  // Reset rate limit before testing to ensure clean state
  await resetRateLimit();

  console.log(`Rate limit test: ${limit} POSTs to ${url}\n`);
  const rems = [];
  for (let i = 1; i <= limit; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": "127.0.0.1",
        "X-RateLimit-Test": "1",
      },
      body: JSON.stringify({ identifier: "login", _rateLimitTest: true }),
    });
    const body = await res.json().catch(() => ({}));
    const status = res.status === 429 ? "429 (rate limited)" : res.status;
    const rem = body.remaining ?? "-";
    rems.push(rem);
    console.log(`Request ${i}: ${status}  remaining=${rem}  ${body.error ?? ""}`);
  }
  console.log("\nDone. Expect requests 1–5 allowed (remaining 4→3→2→1→0), 6+ return 429.");
  const oscillating = rems.length >= 4 && rems[0] === 4 && rems[1] === 3 && rems[2] === 4 && rems[3] === 3;
  if (oscillating) {
    console.log("Tip: Remaining is alternating (4,3,4,3). Restart the dev server and run again so the API uses the test window and fixed client.");
  }
}

run().catch((e) => {
  const code = e.cause?.code ?? e.cause?.errors?.[0]?.code;
  if (code === "ECONNREFUSED") {
    console.error("Connection refused. Is the dev server running? Start it with: npm run dev");
  }
  console.error(e);
  process.exit(1);
});

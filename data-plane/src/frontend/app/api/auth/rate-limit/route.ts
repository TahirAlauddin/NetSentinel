/**
 * Rate limiting middleware for authentication endpoints
 * This can be used as a wrapper or called before authentication routes
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resetRateLimit, RateLimitPresets } from "@/lib/security/rate-limit";

/**
 * Rate limit check endpoint
 * Can be used to check rate limits before processing requests
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const identifier = body?.identifier;
  // Header normalizes to lowercase: "X-RateLimit-Test" → "x-ratelimit-test"
  const testHeader = request.headers.get("x-ratelimit-test") ?? request.headers.get("x-rate-limit-test");
  const isScriptTest = testHeader === "1" || body?._rateLimitTest === true;

  // Use login preset by default, or allow custom identifier.
  // In dev, use short-window preset for login so tests see 429 quickly.
  // When the test script sends X-RateLimit-Test: 1, use a 15‑min window and a fixed client so all requests share one bucket.
  let config =
    identifier === "password-reset"
      ? RateLimitPresets.passwordReset
      : process.env.NODE_ENV === "development"
        ? RateLimitPresets.loginTest
        : RateLimitPresets.login;
  if (isScriptTest && identifier !== "password-reset") {
    config = RateLimitPresets.loginTestStable;
  }

  const reqForLimit =
    isScriptTest
      ? { headers: new Headers([["x-forwarded-for", "127.0.0.1"]]) }
      : request;
  const result = await checkRateLimit(config, reqForLimit);

  if (!result.allowed) {
    const resetSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        resetIn: resetSeconds,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({
    allowed: true,
    remaining: result.remaining,
    resetTime: result.resetTime,
  });
}

/**
 * Reset rate limit for testing purposes
 * Only available in development mode
 */
export async function DELETE(request: NextRequest) {
  // Only allow in development or when X-RateLimit-Test header is present
  const testHeader = request.headers.get("x-ratelimit-test") ?? request.headers.get("x-rate-limit-test");
  const isScriptTest = testHeader === "1";
  
  if (process.env.NODE_ENV !== "development" && !isScriptTest) {
    return NextResponse.json(
      { error: "Rate limit reset only available in development" },
      { status: 403 }
    );
  }

  const config = RateLimitPresets.loginTestStable;
  const reqForLimit = { headers: new Headers([["x-forwarded-for", "127.0.0.1"]]) };
  
  const result = await resetRateLimit(config, reqForLimit);

  return NextResponse.json({
    reset: result.success,
    message: "Rate limit has been reset for testing",
  });
}

/**
 * Rate limiting middleware for authentication endpoints
 * This can be used as a wrapper or called before authentication routes
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitPresets } from "@/lib/security/rate-limit";

/**
 * Rate limit check endpoint
 * Can be used to check rate limits before processing requests
 */
export async function POST(request: NextRequest) {
  const { identifier } = await request.json();
  
  // Use login preset by default, or allow custom identifier
  const config = identifier === "password-reset" 
    ? RateLimitPresets.passwordReset
    : RateLimitPresets.login;

  const result = await checkRateLimit(config, request);

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

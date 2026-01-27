import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, RateLimitPresets } from "@/lib/security/rate-limit"

const handler = NextAuth(authOptions)

/**
 * Rate-limited NextAuth handler
 * Applies rate limiting to login attempts
 */
async function rateLimitedHandler(
  req: NextRequest,
  method: "GET" | "POST"
) {
  // Only apply rate limiting to POST requests (login attempts)
  if (method === "POST") {
    // Check if this is a signin request by checking the URL path
    const url = new URL(req.url)
    const isSignIn = url.pathname.includes("/signin") || url.pathname.includes("/callback")
    
    if (isSignIn) {
      const rateLimitResult = await checkRateLimit(RateLimitPresets.login, req)
      
      if (!rateLimitResult.allowed) {
        const resetSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: `Too many login attempts. Please try again in ${resetSeconds} seconds.`,
          },
          { status: 429 }
        )
      }
    }
  }

  // Call the original NextAuth handler
  // NextAuth handler expects Request, not NextRequest, but it should work
  return handler(req as unknown as Request)
}

export async function GET(req: NextRequest) {
  return rateLimitedHandler(req, "GET")
}

export async function POST(req: NextRequest) {
  return rateLimitedHandler(req, "POST")
}

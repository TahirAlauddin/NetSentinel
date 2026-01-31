import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, RateLimitPresets } from "@/lib/security/rate-limit"

/** Set to true to enable rate limiting on login/signin. Disabled for now to avoid request-shape issues. */
const RATE_LIMIT_AUTH_ENABLED = true

const handler = NextAuth(authOptions)

/** App Router passes context with params.nextauth; NextAuth needs it to choose Route Handler (not Pages API) path. */
type AuthRouteContext = { params: Promise<{ nextauth?: string[] }> }

/**
 * Rate-limited NextAuth handler
 * Applies rate limiting to login attempts (when RATE_LIMIT_AUTH_ENABLED is true)
 */
async function rateLimitedHandler(
  req: NextRequest,
  method: "GET" | "POST",
  context: AuthRouteContext
) {
  if (RATE_LIMIT_AUTH_ENABLED) {
    if (method === "POST") {
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
  }

  return handler(req as unknown as Request, context)
}

export async function GET(req: NextRequest, context: AuthRouteContext) {
  return rateLimitedHandler(req, "GET", context)
}

export async function POST(req: NextRequest, context: AuthRouteContext) {
  return rateLimitedHandler(req, "POST", context)
}

/**
 * Rate limiting utility for Server Actions and API routes
 * Prevents brute-force attacks and abuse
 * 
 * Note: For production, consider using Upstash Redis or Vercel Edge Middleware
 * This is a simple in-memory implementation for development/testing
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  maxRequests: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  /**
   * Optional identifier for the rate limit (e.g., 'login', 'password-reset')
   */
  identifier?: string;
}

/**
 * Get client identifier (IP address or user ID)
 * Works with Request, Headers, or Next.js headers() from next/headers
 */
function getClientIdentifier(
  request?: Request | { headers: Headers | Map<string, string> } | null
): string {
  if (!request) {
    return "unknown";
  }

  // Handle Next.js headers() which returns a Headers object
  let headers: Headers | Map<string, string>;
  if (request instanceof Request) {
    headers = request.headers;
  } else if ("headers" in request) {
    headers = request.headers;
  } else {
    return "unknown";
  }

  // Try to get IP from headers (set by proxy/load balancer)
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    } else if (headers instanceof Map) {
      return headers.get(name) || null;
    }
    return null;
  };

  const forwardedFor = getHeader("x-forwarded-for");
  const realIp = getHeader("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  
  return ip;
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit check
 * Returns true if request should be allowed, false if rate limited
 * Works with Request, Headers, or Next.js headers() from next/headers
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  request?: Request | { headers: Headers | Map<string, string> } | null
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const clientId = getClientIdentifier(request);
  const key = config.identifier 
    ? `${config.identifier}:${clientId}`
    : clientId;
  
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  
  // Clean up expired entries periodically (every 1000 checks)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries();
  }
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + windowMs,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit wrapper for Server Actions
 * Throws error if rate limit exceeded
 * Works with Request, Headers, or Next.js headers() from next/headers
 */
export async function withRateLimit<T>(
  request: Request | { headers: Headers | Map<string, string> } | null | undefined,
  config: RateLimitConfig,
  action: () => Promise<T>
): Promise<T> {
  const result = await checkRateLimit(config, request);
  
  if (!result.allowed) {
    const resetSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    throw new Error(
      `Rate limit exceeded. Please try again in ${resetSeconds} seconds.`
    );
  }
  
  return action();
}

/**
 * Helper to get headers for rate limiting in Server Actions
 * Usage: const headersList = await getHeadersForRateLimit()
 */
export async function getHeadersForRateLimit() {
  // Dynamic import to avoid issues in non-server contexts
  const { headers } = await import("next/headers");
  return headers();
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Login attempts: 5 per 15 minutes
   */
  login: {
    maxRequests: 5,
    windowSeconds: 15 * 60, // 15 minutes
    identifier: "login",
  },
  
  /**
   * Password reset: 3 per hour
   */
  passwordReset: {
    maxRequests: 3,
    windowSeconds: 60 * 60, // 1 hour
    identifier: "password-reset",
  },
  
  /**
   * General API: 100 per minute
   */
  general: {
    maxRequests: 100,
    windowSeconds: 60, // 1 minute
    identifier: "general",
  },
  
  /**
   * Public API: 30 per minute
   */
  public: {
    maxRequests: 30,
    windowSeconds: 60, // 1 minute
    identifier: "public",
  },
} as const;

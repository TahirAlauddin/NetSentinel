/**
 * Rate limiting utility for Server Actions and API routes
 * Prevents brute-force attacks and abuse
 *
 * Production: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to use Redis.
 * Otherwise uses in-memory store (single-instance, resets on deploy).
 *
 * Uses @upstash/ratelimit with sliding window algorithm for better burst handling.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

  let headers: Headers | Map<string, string>;
  if (request instanceof Request) {
    headers = request.headers;
  } else if ("headers" in request) {
    headers = request.headers;
  } else {
    return "unknown";
  }

  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    if (headers instanceof Map) {
      return headers.get(name) ?? null;
    }
    return null;
  };

  const forwardedFor = getHeader("x-forwarded-for");
  const realIp = getHeader("x-real-ip");
  let ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  // Normalize localhost so dev/test don't split between 127.0.0.1 and ::1
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }
  return ip;
}

// --- Redis-based rate limiter (Upstash) ---
// Cache Ratelimit instances per config signature (maxRequests + windowSeconds)
// This avoids creating new instances on every request
const ratelimitCache = new Map<string, Ratelimit>();
// Shared ephemeral cache across all instances for consistency
// Type must be Map<string, number> for Upstash Ratelimit 
const sharedEphemeralCache = new Map<string, number>();
let _redisClient: Redis | null | undefined = undefined;

function getRedisClient(): Redis | null {
  if (_redisClient !== undefined) {
    return _redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _redisClient = null;
    return null;
  }

  try {
    _redisClient = new Redis({ url, token });
    return _redisClient;
  } catch {
    _redisClient = null;
    return null;
  }
}

function getRatelimitInstance(maxRequests: number, windowSeconds: number): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  // Create cache key from config
  const cacheKey = `${maxRequests}:${windowSeconds}`;

  // Return cached instance if available
  if (ratelimitCache.has(cacheKey)) {
    return ratelimitCache.get(cacheKey)!;
  }

  // Create new instance with sliding window algorithm
  // (recommended by Upstash for better burst handling)
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
    analytics: true,
    prefix: "@netsentinel/ratelimit",
    // Use shared ephemeral cache for consistency across instances
    // Note: Ephemeral cache can sometimes cause incorrect remaining counts
    // If you see remaining=0 on first request, try disabling ephemeral cache
    ephemeralCache: sharedEphemeralCache as Map<string, number>,
    // Allow requests if Redis is temporarily unavailable (fail open)
    timeout: 1000,
  });

  ratelimitCache.set(cacheKey, ratelimit);
  return ratelimit;
}

// --- In-memory rate limiter (fallback) ---
interface RateLimitStore {
  count: number;
  resetTime: number;
}

// Attach to globalThis so the same store is reused across HMR/reloads in dev
const GLOBAL_STORE_KEY = "__netSentinel_rateLimitStore";
const g = typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>) : undefined;
const memoryStore: Map<string, RateLimitStore> =
  g && g[GLOBAL_STORE_KEY] instanceof Map
    ? (g[GLOBAL_STORE_KEY] as Map<string, RateLimitStore>)
    : (() => {
        const m = new Map<string, RateLimitStore>();
        if (g) g[GLOBAL_STORE_KEY] = m;
        return m;
      })();

function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Window expired or doesn't exist, start fresh
    const resetTime = now + windowMs;
    memoryStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  // Increment count
  entry.count++;
  memoryStore.set(key, entry);

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit check
 * Uses Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * Falls back to in-memory store otherwise.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  request?: Request | { headers: Headers | Map<string, string> } | null
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const clientId = getClientIdentifier(request);
  const identifier = config.identifier || "default";
  const key = `${identifier}:${clientId}`;

  // Try Redis first
  const ratelimit = getRatelimitInstance(config.maxRequests, config.windowSeconds);
  if (ratelimit) {
    try {
      const result = await ratelimit.limit(key);

      // Upstash returns reset as Unix timestamp in milliseconds
      // remaining is how many requests are left in the current window
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetTime: result.reset,
      };
    } catch (error) {
      // If Redis fails, fall back to in-memory
      console.warn("Redis rate limit check failed, falling back to in-memory:", error);
    }
  }

  // Fallback to in-memory store
  const windowMs = config.windowSeconds * 1000;
  return checkMemoryRateLimit(key, config.maxRequests, windowMs);
}

/**
 * Rate limit wrapper for Server Actions
 * Throws if rate limit exceeded
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
 * Headers for rate limiting in Server Actions
 * Usage: const headersList = await getHeadersForRateLimit()
 */
export async function getHeadersForRateLimit() {
  const { headers } = await import("next/headers");
  return headers();
}

/**
 * Reset rate limit for a specific identifier and client
 * Useful for testing or when you need to manually clear a rate limit
 */
export async function resetRateLimit(
  config: RateLimitConfig,
  request?: Request | { headers: Headers | Map<string, string> } | null
): Promise<{ success: boolean }> {
  const clientId = getClientIdentifier(request);
  const identifier = config.identifier || "default";
  const key = `${identifier}:${clientId}`;

  // Try Redis first
  const ratelimit = getRatelimitInstance(config.maxRequests, config.windowSeconds);
  if (ratelimit) {
    try {
      await ratelimit.resetUsedTokens(key);
      // Also clear ephemeral cache for this key
      sharedEphemeralCache.delete(key);
      return { success: true };
    } catch (error) {
      console.warn("Redis rate limit reset failed:", error);
    }
  }

  // Fallback to in-memory store
  memoryStore.delete(key);
  return { success: true };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  login: {
    maxRequests: 5,
    windowSeconds: 15 * 60,
    identifier: "login",
  },
  /** Short window for testing rate limits in dev (same limit as login, 15s TTL) */
  loginTest: {
    maxRequests: 5,
    windowSeconds: 15,
    identifier: "login",
  },
  /** Long window (15 min) for scripted tests so all requests share one bucket; same length as login */
  loginTestStable: {
    maxRequests: 5,
    windowSeconds: 15 * 60,
    identifier: "login",
  },
  passwordReset: {
    maxRequests: 3,
    windowSeconds: 60 * 60,
    identifier: "password-reset",
  },
  general: {
    maxRequests: 100,
    windowSeconds: 60,
    identifier: "general",
  },
  public: {
    maxRequests: 30,
    windowSeconds: 60,
    identifier: "public",
  },
} as const;

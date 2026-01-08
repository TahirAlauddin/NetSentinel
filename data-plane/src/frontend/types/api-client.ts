/**
 * Shared types for API clients
 */

export interface BaseApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
  errorData?: unknown // Raw error data for detailed error handling
}

export interface BaseApiRequestOptions extends RequestInit {
  requireAuth?: boolean
  skipRefresh?: boolean
}

export interface ServerApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
  // Note: ServerApiResponse intentionally omits errorData field
  // for simpler server-side error handling
}

export interface ServerApiRequestOptions extends RequestInit {
  requireAuth?: boolean
  // Note: Server-side doesn't support skipRefresh option
  // as server-side should always attempt token refresh
}

/**
 * Session interface for type safety
 */
export interface ApiSession {
  accessToken?: string
  refreshToken?: string
  error?: string
}


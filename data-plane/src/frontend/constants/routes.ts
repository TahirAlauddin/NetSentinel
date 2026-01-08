/**
 * Route definitions for authentication and authorization
 */

/**
 * Routes that require authentication
 */
export const protectedRoutes = ['/dashboard', '/profile', '/settings'] as const

/**
 * Routes that are authentication-related (login, register, etc.)
 * Authenticated users should be redirected away from these routes
 */
export const authRoutes = ['/login', '/register'] as const

/**
 * Check if a pathname is a protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if a pathname is an authentication route
 */
export function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route))
}


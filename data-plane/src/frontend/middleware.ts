import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { JWT } from "next-auth/jwt"
import { isProtectedRoute, isAuthRoute } from "@/constants/routes"

/**
 * Type guard to check if a token has a refresh error
 */
function hasTokenError(token: JWT | null | undefined): token is JWT & { error: string } {
  return token !== null && token !== undefined && token.error === 'RefreshAccessTokenError'
}

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl
    const token = req.nextauth.token

    // Check if the current path is an auth route
    const isCurrentAuthRoute = isAuthRoute(pathname)
    
    // Check if token has an error (e.g., RefreshAccessTokenError)
    // This happens when token refresh fails (backend down, refresh token expired, etc.)
    const tokenHasError = hasTokenError(token)
    
    // Check if we're already on the login page
    const isOnLoginPage = pathname === '/login'
    
    // Prevent nested callbackUrl loops by checking if callbackUrl contains /login
    //? Fixes infinite redirect loops when callbackUrl contains /login
    if (isOnLoginPage) {
      const callbackUrl = searchParams.get('callbackUrl')
      if (callbackUrl && callbackUrl.includes('/login')) {
        // Nested callbackUrl detected - redirect to clean login URL
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
    
    // If token has an error, we need to redirect to login
    // But only if we're not already there (prevent loops)
    if (tokenHasError && !isOnLoginPage) {
      // Redirect to login without callbackUrl to break the loop
      // The session error handler will handle sign out
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    // If accessing auth routes while authenticated (and no error), redirect to dashboard
    if (isCurrentAuthRoute && token && !tokenHasError) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // For the root path, redirect appropriately
    if (pathname === '/') {
      if (token && !tokenHasError) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        const isCurrentProtectedRoute = isProtectedRoute(pathname)
        const isCurrentAuthRoute = isAuthRoute(pathname)

        // Check if token has an error
        const tokenHasError = hasTokenError(token)
        
        // If token has an error, don't authorize access to protected routes
        // This will trigger a redirect to login, which we handle in the middleware function
        if (tokenHasError && isCurrentProtectedRoute) {
          return false
        }

        // Allow access to auth routes when not authenticated or when token has error
        if (isCurrentAuthRoute && (!token || tokenHasError)) return true
        
        // Allow access to protected routes when authenticated and no error
        if (isCurrentProtectedRoute && token && !tokenHasError) return true
        
        // Allow access to root path
        if (pathname === '/') return true
        
        // Allow access to public routes
        if (!isCurrentProtectedRoute && !isCurrentAuthRoute) return true
        
        return false
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

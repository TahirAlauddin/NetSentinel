import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl
    const token = req.nextauth.token as any // Token may have error field

    // Define protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/settings']
    const authRoutes = ['/login', '/register']

    // Check if the current path is an auth route
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // Check if token has an error (e.g., RefreshAccessTokenError)
    // This happens when token refresh fails (backend down, refresh token expired, etc.)
    const hasTokenError = token?.error === 'RefreshAccessTokenError'
    
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
    if (hasTokenError && !isOnLoginPage) {
      // Redirect to login without callbackUrl to break the loop
      // The session error handler will handle sign out
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    // If accessing auth routes while authenticated (and no error), redirect to dashboard
    if (isAuthRoute && token && !hasTokenError) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // For the root path, redirect appropriately
    if (pathname === '/') {
      if (token && !hasTokenError) {
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
        const protectedRoutes = ['/dashboard', '/profile', '/settings']
        const authRoutes = ['/login', '/register']
        
        const isProtectedRoute = protectedRoutes.some(route => 
          pathname.startsWith(route)
        )
        const isAuthRoute = authRoutes.some(route => 
          pathname.startsWith(route)
        )

        // Check if token has an error
        const hasTokenError = (token as any)?.error === 'RefreshAccessTokenError'
        
        // If token has an error, don't authorize access to protected routes
        // This will trigger a redirect to login, which we handle in the middleware function
        if (hasTokenError && isProtectedRoute) {
          return false
        }

        // Allow access to auth routes when not authenticated or when token has error
        if (isAuthRoute && (!token || hasTokenError)) return true
        
        // Allow access to protected routes when authenticated and no error
        if (isProtectedRoute && token && !hasTokenError) return true
        
        // Allow access to root path
        if (pathname === '/') return true
        
        // Allow access to public routes
        if (!isProtectedRoute && !isAuthRoute) return true
        
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

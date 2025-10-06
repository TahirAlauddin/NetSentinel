import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Define protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/settings']
    const authRoutes = ['/login', '/register']

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // Check if the current path is an auth route
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    )

    // If accessing a protected route without authentication, redirect to login
    if (isProtectedRoute && !token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // If accessing auth routes while authenticated, redirect to dashboard
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // For the root path, redirect to dashboard if authenticated, otherwise to login
    if (pathname === '/') {
      if (token) {
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

        // Allow access to auth routes when not authenticated
        if (isAuthRoute && !token) return true
        
        // Allow access to protected routes when authenticated
        if (isProtectedRoute && token) return true
        
        // Allow access to root path
        if (pathname === '/') return true
        
        // Allow access to public routes
        if (!isProtectedRoute && !isAuthRoute) return true
        
        return false
      },
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

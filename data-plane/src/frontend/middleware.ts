import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { JWT } from "next-auth/jwt"
import { isProtectedRoute, isAuthRoute } from "@/constants/routes"

/**
 * Type guard to check if a token has a refresh error
 */
function hasTokenError(token: JWT | null | undefined): token is JWT & { error: string } {
  return token !== null && token !== undefined && token.error === 'RefreshAccessTokenError'
}

/** Generate a cryptographically random nonce for CSP (Edge-compatible). */
function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Build CSP header and request headers with nonce so Next.js can apply it to inline scripts. */
function applyNonceCsp(req: NextRequest): { requestHeaders: Headers; cspHeader: string } {
  const nonce = generateNonce()
  const isDev = process.env.NODE_ENV === 'development'
  let apiOrigin = 'http://localhost:8000'
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL).origin
    } catch {
      // keep default
    }
  }
  const connectSrc = isDev
    ? `'self' ${apiOrigin} ws://localhost:* http://localhost:*`
    : "'self'"
  // script-src: no 'unsafe-inline' / 'unsafe-eval'; nonce + 'strict-dynamic' allow our scripts only
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`
  // style-src nonce only covers <style> tags Next.js tags with a nonce. React style={{ }},
  // Radix, etc. use style attributes / JS "Applying style" — those need style-src-attr or
  // unsafe-inline. Next.js recommends unsafe-inline for style-src in dev (HMR); in prod we
  // keep nonced <style> and allow attributes via CSP Level 3 style-src-attr.
  const styleSrc = isDev
    ? `'self' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}'`
  const cspParts = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // if this doesn't work, revert back to 'self' 'nonce-${nonce}'
    `style-src ${styleSrc}`,
    ...(isDev ? [] : ["style-src-attr 'unsafe-inline'"]),
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]
  const cspHeader = cspParts.join("; ").replace(/\s{2,}/g, ' ').trim()
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)
  return { requestHeaders, cspHeader }
}

function setCspOnResponse(response: NextResponse, cspHeader: string): NextResponse {
  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}

export default withAuth(
  function middleware(req) {
    const { requestHeaders, cspHeader } = applyNonceCsp(req)
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
        const res = NextResponse.redirect(new URL('/login', req.url))
        return setCspOnResponse(res, cspHeader)
      }
    }
    
    // If token has an error, we need to redirect to login
    // But only if we're not already there (prevent loops)
    if (tokenHasError && !isOnLoginPage) {
      const res = NextResponse.redirect(new URL('/login', req.url))
      return setCspOnResponse(res, cspHeader)
    }
    
    // If accessing auth routes while authenticated (and no error), redirect to dashboard
    if (isCurrentAuthRoute && token && !tokenHasError) {
      const res = NextResponse.redirect(new URL('/dashboard', req.url))
      return setCspOnResponse(res, cspHeader)
    }
    
    // For the root path, redirect appropriately
    if (pathname === '/') {
      if (token && !tokenHasError) {
        const res = NextResponse.redirect(new URL('/dashboard', req.url))
        return setCspOnResponse(res, cspHeader)
      } else {
        const res = NextResponse.redirect(new URL('/login', req.url))
        return setCspOnResponse(res, cspHeader)
      }
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } })
    return setCspOnResponse(res, cspHeader)
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

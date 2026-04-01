'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Can, usePermissions } from '@/contexts/permissions-context'

/**
 * Props interface for the ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** The child components to render if authentication and authorization checks pass */
  children: React.ReactNode
  /** Optional role requirement - 'user' for basic auth, 'admin' for staff-only access */
  requiredRole?: 'user' | 'admin'
  /** Optional Django permission codename (e.g. "ipam.view_subnet") */
  requiredPermission?: string
}

/**
 * ProtectedRoute Component
 * 
 * A wrapper component that protects routes by checking authentication and authorization.
 * This component ensures that only authenticated users can access protected content,
 * and optionally enforces role-based access control for admin-only areas.
 * 
 * Features:
 * - Authentication check (user must be logged in)
 * - Role-based authorization (admin role requires isStaff flag)
 * - Automatic redirection to appropriate pages based on auth state
 * - Loading states during authentication checks
 * - SSR-safe (hydration handled by NextAuth)
 * 
 * @param children - The content to render if access is granted
 * @param requiredRole - Optional role requirement ('user' or 'admin')
 */
export function ProtectedRoute({ children, requiredRole, requiredPermission }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { can } = usePermissions()

  // Handle authentication and authorization checks
  useEffect(() => {
    // Only perform checks after session is loaded
    if (status === 'loading') return

    // Redirect to login if user is not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (!session?.user) {
      router.push('/login')
      return
    }

    // If there's a session error (like refresh token failure), redirect to login
    if (session.error === 'RefreshAccessTokenError') {
      router.push('/login')
      return
    }

    // Check admin role requirement - user must have isStaff flag set to true
    if (requiredRole === 'admin' && !session.user.isStaff) {
      router.push('/unauthorized')
      return
    }

    if (requiredPermission && !can(requiredPermission)) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, requiredRole, requiredPermission, can, router])

  // Show loading spinner while session is being determined
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <div className="ml-4 text-lg">Loading auth state...</div>
      </div>
    )
  }

  // Show loading spinner if user is not authenticated
  // This provides a smooth transition while redirecting to login
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <div className="ml-4 text-lg">Redirecting to login...</div>
      </div>
    )
  }

  // Show loading spinner if admin role is required but user lacks admin privileges
  // This provides a smooth transition while redirecting to unauthorized page
  if (requiredRole === 'admin' && session?.user && !session.user.isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <div className="ml-4 text-lg">Redirecting to unauthorized...</div>
      </div>
    )
  }

  if (requiredPermission && session?.user && !can(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <div className="ml-4 text-lg">Redirecting to unauthorized...</div>
      </div>
    )
  }

  // All checks passed - render the protected content
  if (!requiredPermission) return <>{children}</>
  return <Can permission={requiredPermission}>{children}</Can>
}

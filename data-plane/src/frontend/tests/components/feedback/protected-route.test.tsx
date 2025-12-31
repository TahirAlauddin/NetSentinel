/**
 * Component tests for components/feedback/protected-route.tsx
 * 
 * Tests cover:
 * - Authentication checks
 * - Role-based authorization
 * - Loading states
 * - Redirects
 */

import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from '@/components/feedback/protected-route'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('ProtectedRoute', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('should render children when authenticated as user', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: 1, username: 'test', isStaff: false },
      },
      status: 'authenticated',
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should render children when authenticated as admin', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: 1, username: 'admin', isStaff: true },
      },
      status: 'authenticated',
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should show loading state when session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText(/loading auth state/i)).toBeInTheDocument()
  })

  it('should redirect to login when unauthenticated', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should redirect to login when session has error', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        error: 'RefreshAccessTokenError',
        user: null,
      },
      status: 'authenticated',
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should redirect to unauthorized when admin role required but user is not staff', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: 1, username: 'user', isStaff: false },
      },
      status: 'authenticated',
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized')
    })
  })

  it('should show loading state when redirecting to login', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument()
  })

  it('should show loading state when redirecting to unauthorized', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: 1, username: 'user', isStaff: false },
      },
      status: 'authenticated',
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText(/redirecting to unauthorized/i)).toBeInTheDocument()
  })
})


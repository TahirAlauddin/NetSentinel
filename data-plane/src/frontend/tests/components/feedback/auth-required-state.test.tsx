/**
 * Component tests for components/feedback/auth-required-state.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { AuthRequiredState } from '@/components/feedback/auth-required-state'

// Mock AppShell to avoid dependency issues
jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('AuthRequiredState', () => {
  it('should render with default message', () => {
    render(<AuthRequiredState />)
    expect(screen.getByText(/please log in to access settings/i)).toBeInTheDocument()
  })

  it('should render with custom message', () => {
    render(<AuthRequiredState message="Custom auth message" />)
    expect(screen.getByText('Custom auth message')).toBeInTheDocument()
  })

  it('should render login link with default text and URL', () => {
    render(<AuthRequiredState />)
    const link = screen.getByRole('link', { name: /go to login/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/login')
  })

  it('should render login link with custom text and URL', () => {
    render(
      <AuthRequiredState
        loginUrl="/signin"
        loginText="Sign In Now"
      />
    )
    const link = screen.getByRole('link', { name: /sign in now/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/signin')
  })

  it('should render all elements together', () => {
    render(
      <AuthRequiredState
        message="Please authenticate"
        loginUrl="/auth"
        loginText="Login"
      />
    )
    expect(screen.getByText('Please authenticate')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/auth')
  })
})



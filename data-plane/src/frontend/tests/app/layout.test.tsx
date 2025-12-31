/**
 * Component tests for app/layout.tsx
 * 
 * Tests cover:
 * - Root layout rendering
 * - ErrorBoundary integration
 * - AuthProvider integration
 * - Children rendering
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import RootLayout from '@/app/layout'

// Mock components
jest.mock('@/components/feedback/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}))

jest.mock('@/components/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}))

jest.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}))

jest.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics">Analytics</div>,
}))

describe('RootLayout', () => {
  it('should render children', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should include ErrorBoundary', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
  })

  it('should include AuthProvider', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
  })

  it('should include Toaster', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('should include Analytics', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('analytics')).toBeInTheDocument()
  })
})


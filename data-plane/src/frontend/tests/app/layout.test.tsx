/**
 * Component tests for app/layout.tsx
 *
 * Tests cover:
 * - Root layout rendering
 * - ErrorBoundary integration
 * - AuthProvider integration
 * - Children rendering
 */

import { renderToStaticMarkup } from 'react-dom/server'
import RootLayout from '@/app/layout'

// Mock next/server so layout does not load Node/Request-dependent code
jest.mock('next/server', () => ({
  connection: jest.fn().mockResolvedValue(undefined),
}))

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

describe('RootLayout', () => {
  const getLayoutMarkup = async () => {
    const element = await RootLayout({
      children: <div>Test Content</div>,
    })
    return renderToStaticMarkup(element)
  }

  it('should render children', async () => {
    const html = await getLayoutMarkup()
    expect(html).toContain('Test Content')
  })

  it('should include ErrorBoundary', async () => {
    const html = await getLayoutMarkup()
    expect(html).toContain('data-testid="error-boundary"')
  })

  it('should include AuthProvider', async () => {
    const html = await getLayoutMarkup()
    expect(html).toContain('data-testid="auth-provider"')
  })

  it('should include Toaster', async () => {
    const html = await getLayoutMarkup()
    expect(html).toContain('data-testid="toaster"')
  })
})


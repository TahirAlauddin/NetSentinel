/**
 * Component tests for components/feedback/error-boundary.tsx
 * 
 * Tests cover:
 * - Error boundary catching errors
 * - Error display
 * - Custom fallback rendering
 * - Reset functionality
 * - Reload functionality
 * - Error handler callback
 * - Development error details
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/feedback/error-boundary'

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  const originalError = console.error
  const mockReload = jest.fn()
  const originalLocation = window.location

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error for error boundary tests
    console.error = jest.fn()
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        ...originalLocation,
        reload: mockReload,
      },
    })
  })

  afterEach(() => {
    console.error = originalError
    // Restore original location
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    })
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
  })

  it('should display custom fallback when provided', () => {
    const customFallback = <div>Custom Error Message</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error Message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should call onError callback when error occurs', () => {
    const mockOnError = jest.fn()
    
    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(mockOnError).toHaveBeenCalled()
    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('should show Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should show Reload Page button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })

  it('should reset error state when Try Again is clicked', async () => {
    const user = userEvent.setup()
    
    // Create a component that can be controlled externally
    let shouldThrow = true
    const TestComponent = ({ key }: { key?: string }) => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>No error</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent key="initial" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    
    // Change shouldThrow before clicking to ensure children don't throw after reset
    shouldThrow = false
    
    await user.click(tryAgainButton)

    // Rerender with a new key to force React to remount children after error boundary reset
    rerender(
      <ErrorBoundary>
        <TestComponent key="after-reset" />
      </ErrorBoundary>
    )

    // Error boundary should reset and show children
    await waitFor(() => {
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should reload page when Reload Page is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: /reload page/i })
    await user.click(reloadButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    // @ts-expect-error - NODE_ENV is readonly but we need to mock it for testing
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/error details.*development only/i)).toBeInTheDocument()
    expect(screen.getByText(/test error/i)).toBeInTheDocument()

    // @ts-expect-error - NODE_ENV is readonly but we need to restore it
    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    // @ts-expect-error - NODE_ENV is readonly but we need to mock it for testing
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText(/error details.*development only/i)).not.toBeInTheDocument()

    // @ts-expect-error - NODE_ENV is readonly but we need to restore it
    process.env.NODE_ENV = originalEnv
  })
})


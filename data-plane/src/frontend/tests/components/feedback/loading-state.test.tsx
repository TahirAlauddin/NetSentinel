/**
 * Component tests for components/feedback/loading-state.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { LoadingState } from '@/components/feedback/loading-state'

// Mock AppShell to avoid dependency issues
jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('LoadingState', () => {
  it('should render with default message', () => {
    render(<LoadingState />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render with custom message', () => {
    render(<LoadingState message="Please wait..." />)
    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })

  it('should render loading state container', () => {
    const { container } = render(<LoadingState />)
    const loadingContainer = container.querySelector('.text-center')
    expect(loadingContainer).toBeInTheDocument()
  })
})



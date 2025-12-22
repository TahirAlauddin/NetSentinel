/**
 * Component tests for components/feedback/permission-denied-state.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { PermissionDeniedState } from '@/components/feedback/permission-denied-state'

// Mock AppShell to avoid dependency issues
jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('PermissionDeniedState', () => {
  it('should render with default message', () => {
    render(<PermissionDeniedState />)
    expect(screen.getByText(/you don't have permission to access user management/i)).toBeInTheDocument()
  })

  it('should render with default description', () => {
    render(<PermissionDeniedState />)
    expect(screen.getByText(/only superusers can manage users/i)).toBeInTheDocument()
  })

  it('should render with custom message', () => {
    render(<PermissionDeniedState message="Access denied" />)
    expect(screen.getByText('Access denied')).toBeInTheDocument()
  })

  it('should render with custom description', () => {
    render(<PermissionDeniedState description="You need admin privileges" />)
    expect(screen.getByText('You need admin privileges')).toBeInTheDocument()
  })

  it('should render both custom message and description', () => {
    render(
      <PermissionDeniedState
        message="Custom permission message"
        description="Custom description text"
      />
    )
    expect(screen.getByText('Custom permission message')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('should render in centered layout', () => {
    const { container } = render(<PermissionDeniedState />)
    const centeredDiv = container.querySelector('.text-center')
    expect(centeredDiv).toBeInTheDocument()
  })
})



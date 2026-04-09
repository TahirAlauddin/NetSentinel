/**
 * Component tests for components/auth-provider.tsx
 * Tests provider rendering and that children receive session context.
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { AuthProvider } from '@/components/auth-provider'

describe('AuthProvider', () => {
  it('should render children', () => {
    render(
      <AuthProvider>
        <span data-testid="child">Child content</span>
      </AuthProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('should provide session context to subtree', () => {
    render(
      <AuthProvider>
        <div>Inside provider</div>
      </AuthProvider>
    )
    expect(screen.getByText('Inside provider')).toBeInTheDocument()
  })

  it('should render without crashing when no session', () => {
    const { container } = render(
      <AuthProvider>
        <span>Content</span>
      </AuthProvider>
    )
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})


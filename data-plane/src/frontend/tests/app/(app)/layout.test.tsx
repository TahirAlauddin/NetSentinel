/**
 * Component tests for app/(app)/layout.tsx
 * 
 * Tests cover:
 * - Layout rendering
 * - Sidebar display
 * - Children rendering
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import AppLayout from '@/app/(app)/layout'

// Mock Sidebar component
jest.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}))

describe('AppLayout', () => {
  it('should render children', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render sidebar on desktop', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('should have correct layout structure', () => {
    const { container } = render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    )

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })
})


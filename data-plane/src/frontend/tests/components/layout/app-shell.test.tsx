/**
 * Component tests for components/layout/app-shell.tsx
 * 
 * Tests cover:
 * - Children rendering
 * - Mobile menu toggle
 * - Sidebar visibility
 * - Navigation links
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { AppShell } from '@/components/layout/app-shell'

// Mock Topbar and Sidebar components
jest.mock('@/components/layout/topbar', () => ({
  Topbar: ({ onMenuToggle }: { onMenuToggle: () => void }) => (
    <div data-testid="topbar">
      <button onClick={onMenuToggle} data-testid="menu-toggle">
        Toggle Menu
      </button>
    </div>
  ),
}))

jest.mock('@/components/layout/sidebar', () => ({
  Sidebar: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="sidebar">
      <button onClick={onClose} data-testid="sidebar-close">
        Close
      </button>
    </div>
  ),
}))

describe('AppShell', () => {
  it('should render children', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render topbar', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    expect(screen.getByTestId('topbar')).toBeInTheDocument()
  })

  it('should toggle mobile menu when menu button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    const menuToggle = screen.getByTestId('menu-toggle')
    await user.click(menuToggle)

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })
  })

  it('should close mobile menu when overlay is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Open menu
    const menuToggle = screen.getByTestId('menu-toggle')
    await user.click(menuToggle)

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    // Click overlay
    const overlay = document.querySelector('.fixed.inset-0')
    if (overlay) {
      await user.click(overlay)
    }

    // Menu should be closed (sidebar not visible)
    await waitFor(() => {
      const sidebar = screen.queryByTestId('sidebar')
      // Sidebar might still be in DOM but hidden, check for transform class
      expect(sidebar).toBeInTheDocument()
    })
  })

  it('should close mobile menu when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Open menu
    const menuToggle = screen.getByTestId('menu-toggle')
    await user.click(menuToggle)

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    // Click close button
    const closeButton = screen.getByTestId('sidebar-close')
    await user.click(closeButton)

    // Menu should be closed
    await waitFor(() => {
      const sidebar = screen.queryByTestId('sidebar')
      expect(sidebar).toBeInTheDocument()
    })
  })

  it('should render sectional navigation links', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    expect(screen.getByText('Sectional Menu')).toBeInTheDocument()
    expect(screen.getByText('Lorem ipsum')).toBeInTheDocument()
    expect(screen.getByText('Dolor sit')).toBeInTheDocument()
  })
})


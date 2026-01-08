/**
 * Component tests for app/(app)/settings/page.tsx
 * 
 * Tests cover:
 * - Page rendering
 * - Component integration
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import SettingsPage from '@/app/(app)/settings/page'

// Mock all child components
jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}))

jest.mock('@/components/settings/settings-sidebar', () => ({
  SettingsSidebar: () => <div data-testid="settings-sidebar">Sidebar</div>,
}))

jest.mock('@/components/settings/settings-nav-tabs', () => ({
  SettingsNavTabs: () => <div data-testid="settings-nav-tabs">Nav Tabs</div>,
}))

jest.mock('@/components/settings/settings-header', () => ({
  SettingsHeader: () => <div data-testid="settings-header">Header</div>,
}))

jest.mock('@/components/settings/settings-overview', () => ({
  SettingsOverview: () => <div data-testid="settings-overview">Overview</div>,
}))

describe('SettingsPage', () => {
  it('should render all components', async () => {
    const page = await SettingsPage()
    render(page)

    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByTestId('settings-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('settings-nav-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('settings-header')).toBeInTheDocument()
    expect(screen.getByTestId('settings-overview')).toBeInTheDocument()
  })
})


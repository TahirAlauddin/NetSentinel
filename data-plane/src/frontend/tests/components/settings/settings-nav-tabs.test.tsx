/**
 * Component tests for components/settings/settings-nav-tabs.tsx
 * 
 * Tests cover:
 * - Tab rendering
 * - Active tab highlighting
 * - Navigation links
 * - Pathname matching
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { SettingsNavTabs } from '@/components/settings/settings-nav-tabs'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

describe('SettingsNavTabs', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all tabs', () => {
    mockUsePathname.mockReturnValue('/settings')
    render(<SettingsNavTabs />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Locations')).toBeInTheDocument()
    expect(screen.getByText('Departments')).toBeInTheDocument()
    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByText('Carrier Contacts')).toBeInTheDocument()
  })

  it('should highlight active tab when pathname matches', () => {
    mockUsePathname.mockReturnValue('/settings/locations')
    render(<SettingsNavTabs />)

    const locationsLink = screen.getByText('Locations').closest('a')
    expect(locationsLink).toHaveClass('font-medium')
  })

  it('should not highlight inactive tabs', () => {
    mockUsePathname.mockReturnValue('/settings')
    render(<SettingsNavTabs />)

    const locationsLink = screen.getByText('Locations').closest('a')
    expect(locationsLink).not.toHaveClass('font-medium')
    expect(locationsLink).toHaveClass('text-muted-foreground')
  })

  it('should have correct href for each tab', () => {
    mockUsePathname.mockReturnValue('/settings')
    render(<SettingsNavTabs />)

    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '/settings')
    expect(screen.getByText('Locations').closest('a')).toHaveAttribute('href', '/settings/locations')
    expect(screen.getByText('Departments').closest('a')).toHaveAttribute('href', '/settings/departments')
    expect(screen.getByText('Categories').closest('a')).toHaveAttribute('href', '/settings/categories')
    expect(screen.getByText('Carrier Contacts').closest('a')).toHaveAttribute('href', '/settings/carrier-contacts')
  })

  it('should highlight overview tab when on /settings', () => {
    mockUsePathname.mockReturnValue('/settings')
    render(<SettingsNavTabs />)

    const overviewLink = screen.getByText('Overview').closest('a')
    expect(overviewLink).toHaveClass('font-medium')
  })

  it('should apply hover styles to inactive tabs', () => {
    mockUsePathname.mockReturnValue('/settings')
    render(<SettingsNavTabs />)

    const locationsLink = screen.getByText('Locations').closest('a')
    expect(locationsLink).toHaveClass('hover:text-foreground')
  })
})


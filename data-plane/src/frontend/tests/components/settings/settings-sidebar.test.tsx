/**
 * Component tests for components/settings/settings-sidebar.tsx
 * 
 * Tests cover:
 * - Sidebar structure and sections
 * - Navigation links
 * - Link hrefs
 * - Section headers
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { SettingsSidebar } from '@/components/settings/settings-sidebar'

describe('SettingsSidebar', () => {
  it('should render all section headers', () => {
    render(<SettingsSidebar />)

    expect(screen.getByText('Main')).toBeInTheDocument()
    expect(screen.getByText('Additional')).toBeInTheDocument()
    expect(screen.getByText('Data')).toBeInTheDocument()
  })

  it('should render Main section links', () => {
    render(<SettingsSidebar />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('People')).toBeInTheDocument()
    expect(screen.getByText('Groups & Permissions')).toBeInTheDocument()
  })

  it('should render Additional section links', () => {
    render(<SettingsSidebar />)

    expect(screen.getByText('Child Company Management')).toBeInTheDocument()
    expect(screen.getByText('Feature Requests')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })

  it('should render Data section links', () => {
    render(<SettingsSidebar />)

    expect(screen.getByText('Export Data')).toBeInTheDocument()
    expect(screen.getByText('Import Data')).toBeInTheDocument()
  })

  it('should have correct hrefs for Main section links', () => {
    render(<SettingsSidebar />)

    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings')
    expect(screen.getByText('People').closest('a')).toHaveAttribute('href', '/settings/people')
    expect(screen.getByText('Groups & Permissions').closest('a')).toHaveAttribute('href', '/settings/groups')
  })

  it('should have correct hrefs for Additional section links', () => {
    render(<SettingsSidebar />)

    expect(screen.getByText('Child Company Management').closest('a')).toHaveAttribute('href', '/settings/company')
    expect(screen.getByText('Feature Requests').closest('a')).toHaveAttribute('href', '/settings/requests')
    expect(screen.getByText('Logs').closest('a')).toHaveAttribute('href', '/settings/logs')
  })

  it('should have correct hrefs for Data section links', () => {
    render(<SettingsSidebar />)

    expect(screen.getByText('Export Data').closest('a')).toHaveAttribute('href', '/settings/export')
    expect(screen.getByText('Import Data').closest('a')).toHaveAttribute('href', '/settings/import')
  })

  it('should have hover styles on links', () => {
    render(<SettingsSidebar />)

    const settingsLink = screen.getByText('Settings').closest('a')
    expect(settingsLink).toHaveClass('hover:bg-[oklch(0.93_0_0)]')
  })

  it('should display arrow indicators for Data section links', () => {
    render(<SettingsSidebar />)

    const exportLink = screen.getByText('Export Data').closest('a')
    const importLink = screen.getByText('Import Data').closest('a')
    
    expect(exportLink?.querySelector('span:last-child')).toHaveTextContent('›')
    expect(importLink?.querySelector('span:last-child')).toHaveTextContent('›')
  })
})


/**
 * Component tests for components/settings/settings-header.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { SettingsHeader } from '@/components/settings/settings-header'

describe('SettingsHeader', () => {
  it('should render current page as title', () => {
    render(<SettingsHeader currentPage="General Settings" />)
    
    expect(screen.getByText('General Settings')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('General Settings')
  })

  it('should not show company management breadcrumb by default', () => {
    render(<SettingsHeader currentPage="General Settings" />)
    
    expect(screen.queryByText('Company Management')).not.toBeInTheDocument()
  })

  it('should show company management breadcrumb when showCompanyManagement is true', () => {
    render(
      <SettingsHeader
        currentPage="Edit Company"
        showCompanyManagement={true}
      />
    )
    
    // "Company Management" appears twice (in breadcrumb and heading), so use getAllByText
    const companyManagementTexts = screen.getAllByText('Company Management')
    expect(companyManagementTexts.length).toBeGreaterThan(0)
    // The currentPage appears in the breadcrumb as a separate span
    expect(screen.getByText('Edit Company')).toBeInTheDocument()
  })

  it('should display "Company Management" as title when showCompanyManagement is true', () => {
    render(
      <SettingsHeader
        currentPage="Edit Company"
        showCompanyManagement={true}
      />
    )
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Company Management')
  })

  it('should display breadcrumb with separator', () => {
    const { container } = render(
      <SettingsHeader
        currentPage="Edit Company"
        showCompanyManagement={true}
      />
    )
    
    // The breadcrumb contains Company Management, separator (›), and currentPage
    // Find the breadcrumb div by looking for the text-muted-foreground class or by structure
    const breadcrumbDiv = container.querySelector('.text-muted-foreground')
    expect(breadcrumbDiv).toBeInTheDocument()
    // Check that it contains both parts of the breadcrumb
    expect(breadcrumbDiv).toHaveTextContent('Company Management')
    expect(breadcrumbDiv).toHaveTextContent('Edit Company')
    // The separator › is a separate span element - check it exists in the breadcrumb
    const separator = breadcrumbDiv?.querySelector('span:nth-child(2)')
    expect(separator).toHaveTextContent('›')
  })

  it('should handle different page names', () => {
    render(<SettingsHeader currentPage="User Preferences" />)
    
    expect(screen.getByText('User Preferences')).toBeInTheDocument()
  })
})



/**
 * Component tests for components/settings/settings-overview.tsx
 * 
 * Tests cover:
 * - Company information display
 * - Edit mode toggle
 * - EditCompany component rendering
 * - Cancel functionality
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { SettingsOverview } from '@/components/settings/settings-overview'

const defaultCompanyData = {
  companyName: 'NetSentinel Corp',
  subdomain: 'netsentinel.app',
  mainContact: 'admin@netsentinel.com',
  phoneNumber: 'No phone number set',
}

// Mock EditCompany component
jest.mock('@/components/edit-company', () => ({
  EditCompany: ({ onCancel, initialData }: { onCancel: () => void; initialData: unknown }) => (
    <div data-testid="edit-company">
      <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
      <div data-testid="initial-data">{JSON.stringify(initialData)}</div>
    </div>
  ),
}))

describe('SettingsOverview', () => {
  it('should render company information', () => {
    render(<SettingsOverview companyData={defaultCompanyData} />)

    expect(screen.getByText('Company Information')).toBeInTheDocument()
    expect(screen.getByText('NetSentinel Corp')).toBeInTheDocument()
    expect(screen.getByText('netsentinel.app')).toBeInTheDocument()
    expect(screen.getByText('admin@netsentinel.com')).toBeInTheDocument()
    expect(screen.getByText('No phone number set')).toBeInTheDocument()
  })

  it('should display all company data fields', () => {
    render(<SettingsOverview companyData={defaultCompanyData} />)

    expect(screen.getByText('Company Name')).toBeInTheDocument()
    expect(screen.getByText('Subdomain')).toBeInTheDocument()
    expect(screen.getByText('Main Contact')).toBeInTheDocument()
    expect(screen.getByText('Main Phone Number')).toBeInTheDocument()
  })

  it('should show Edit button', () => {
    render(<SettingsOverview companyData={defaultCompanyData} />)

    const editButton = screen.getByRole('button', { name: /edit/i })
    expect(editButton).toBeInTheDocument()
  })

  it('should switch to edit mode when Edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsOverview companyData={defaultCompanyData} />)

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    expect(screen.getByTestId('edit-company')).toBeInTheDocument()
    expect(screen.queryByText('Company Information')).not.toBeInTheDocument()
  })

  it('should pass correct initial data to EditCompany', async () => {
    const user = userEvent.setup()
    render(<SettingsOverview companyData={defaultCompanyData} />)

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    const initialDataElement = screen.getByTestId('initial-data')
    const initialData = JSON.parse(initialDataElement.textContent || '{}')
    
    expect(initialData.companyName).toBe('NetSentinel Corp')
    expect(initialData.subdomain).toBe('netsentinel')
    expect(initialData.mainContact).toBe('admin@netsentinel.com')
    expect(initialData.phoneNumber).toBe('No phone number set')
  })

  it('should return to view mode when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsOverview companyData={defaultCompanyData} />)

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    // Verify edit mode
    expect(screen.getByTestId('edit-company')).toBeInTheDocument()

    // Click cancel
    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)

    // Verify back to view mode
    await waitFor(() => {
      expect(screen.queryByTestId('edit-company')).not.toBeInTheDocument()
      expect(screen.getByText('Company Information')).toBeInTheDocument()
    })
  })
})


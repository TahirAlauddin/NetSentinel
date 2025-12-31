/**
 * Component tests for components/edit-company.tsx
 * 
 * Tests cover:
 * - Form rendering
 * - Initial data population
 * - Form field updates
 * - Form submission
 * - Cancel functionality
 * - Checkbox toggles
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { EditCompany } from '@/components/edit-company'

// Mock console.log
const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

describe('EditCompany', () => {
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    consoleSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  it('should render all form fields', () => {
    render(<EditCompany onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument()
    // Company URL label includes additional text, so search for the input by placeholder or name
    expect(screen.getByPlaceholderText(/https:\/\/example\.com/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/main contact/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/main phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/time zone/i)).toBeInTheDocument()
  })

  it('should populate form with initial data', () => {
    const initialData = {
      companyName: 'Test Company',
      subdomain: 'testcompany',
      mainContact: 'test@example.com',
    }

    render(<EditCompany onCancel={mockOnCancel} initialData={initialData} />)

    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testcompany')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('should use default values when initialData is not provided', () => {
    render(<EditCompany onCancel={mockOnCancel} />)

    expect(screen.getByDisplayValue('NetSentinel Corp')).toBeInTheDocument()
    expect(screen.getByDisplayValue('netsentinel')).toBeInTheDocument()
  })

  it('should update form fields when user types', async () => {
    const user = userEvent.setup()
    render(<EditCompany onCancel={mockOnCancel} />)

    const companyNameInput = screen.getByLabelText(/company name/i)
    await user.clear(companyNameInput)
    await user.type(companyNameInput, 'New Company Name')

    expect(companyNameInput).toHaveValue('New Company Name')
  })

  it('should update subdomain and show preview URL', async () => {
    const user = userEvent.setup()
    render(<EditCompany onCancel={mockOnCancel} />)

    const subdomainInput = screen.getByLabelText(/subdomain/i)
    await user.clear(subdomainInput)
    await user.type(subdomainInput, 'mycompany')

    expect(subdomainInput).toHaveValue('mycompany')
    expect(screen.getByText(/https:\/\/mycompany\.gogenuity\.com/i)).toBeInTheDocument()
  })

  it('should handle phone number input', async () => {
    const user = userEvent.setup()
    render(<EditCompany onCancel={mockOnCancel} />)

    const phoneInput = screen.getByPlaceholderText(/phone number/i)
    await user.type(phoneInput, '1234567890')

    expect(phoneInput).toHaveValue('1234567890')
  })

  it('should handle checkbox toggles', async () => {
    const user = userEvent.setup()
    const { container } = render(<EditCompany onCancel={mockOnCancel} />)

    // Find checkbox by name attribute since label isn't properly associated
    const isolateWorkspacesCheckbox = container.querySelector('input[name="isolateWorkspaces"]') as HTMLInputElement
    
    expect(isolateWorkspacesCheckbox).toBeInTheDocument()
    expect(isolateWorkspacesCheckbox).not.toBeChecked()

    await user.click(isolateWorkspacesCheckbox)
    expect(isolateWorkspacesCheckbox).toBeChecked()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<EditCompany onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should handle form submission', async () => {
    const user = userEvent.setup()
    render(<EditCompany onCancel={mockOnCancel} />)

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  it('should render all sections', () => {
    render(<EditCompany onCancel={mockOnCancel} />)

    expect(screen.getByText('Basic Details')).toBeInTheDocument()
  })

  it('should handle time zone selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<EditCompany onCancel={mockOnCancel} />)

    // Find select by name attribute since label isn't properly associated
    const timeZoneSelect = container.querySelector('select[name="timeZone"]') as HTMLSelectElement
    
    expect(timeZoneSelect).toBeInTheDocument()
    await user.selectOptions(timeZoneSelect, 'Pacific Time (US & Canada)')

    expect(timeZoneSelect).toHaveValue('Pacific Time (US & Canada)')
  })

  it('should handle fiscal year month and day selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<EditCompany onCancel={mockOnCancel} />)

    const monthSelect = container.querySelector('select[name="fiscalYearMonth"]') as HTMLSelectElement
    const daySelect = container.querySelector('select[name="fiscalYearDay"]') as HTMLSelectElement

    expect(monthSelect).toBeInTheDocument()
    expect(daySelect).toBeInTheDocument()

    await user.selectOptions(monthSelect, 'June')
    expect(monthSelect).toHaveValue('June')

    await user.selectOptions(daySelect, '15')
    expect(daySelect).toHaveValue('15')
  })
})


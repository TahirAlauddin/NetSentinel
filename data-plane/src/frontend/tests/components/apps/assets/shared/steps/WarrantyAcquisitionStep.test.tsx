/**
 * Component tests for components/apps/assets/shared/steps/WarrantyAcquisitionStep.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - Machine serial number input
 * - Product number input
 * - Date fields
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { WarrantyAcquisitionStep } from '@/components/apps/assets/shared/steps/WarrantyAcquisitionStep'
import * as useFormDataFetch from '@/components/apps/assets/hooks/useFormDataFetch'
import * as useAssetForm from '@/components/apps/assets/shared/form/AssetFormContext'

// Mock hooks
jest.mock('@/components/apps/assets/hooks/useFormDataFetch', () => ({
  useWarrantyAcquisitionStep: jest.fn(),
}))

jest.mock('@/components/apps/assets/shared/form/AssetFormContext', () => ({
  useAssetForm: jest.fn(),
}))

// Mock form components
jest.mock('@/components/apps/assets/shared/form', () => ({
  DateField: ({ label, value, onChange, error }: { label: string; value: string | null; onChange: (value: string) => void; error?: string }) => (
    <div data-testid={`date-field-${label}`}>
      <label>{label}</label>
      {error && <span data-testid={`error-${label}`}>{error}</span>}
      <input
        data-testid={`date-input-${label}`}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}))

describe('WarrantyAcquisitionStep', () => {
  const mockOnInputChange = jest.fn()
  const mockUseWarrantyAcquisitionStep = jest.mocked(useFormDataFetch.useWarrantyAcquisitionStep)
  const mockUseAssetForm = jest.mocked(useAssetForm.useAssetForm)

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseWarrantyAcquisitionStep.mockReturnValue({
      formData: {
        machine_serial_number: '',
        product_number: '',
        acquisition_date: '',
        warranty_expiration: '',
        installation_date: '',
      },
      onInputChange: mockOnInputChange,
    })

    mockUseAssetForm.mockReturnValue({
      fieldErrors: {},
    })
  })

  it('should render component with title', () => {
    render(<WarrantyAcquisitionStep />)

    expect(screen.getByText('Warranty & Acquisition')).toBeInTheDocument()
  })

  it('should render machine serial number field', () => {
    render(<WarrantyAcquisitionStep />)

    expect(screen.getByText(/machine serial number/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Serial number')).toBeInTheDocument()
  })

  it('should render product number field', () => {
    render(<WarrantyAcquisitionStep />)

    expect(screen.getByText(/product number/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Product number')).toBeInTheDocument()
  })

  it('should render date fields', () => {
    render(<WarrantyAcquisitionStep />)

    expect(screen.getByTestId('date-field-Acquisition Date')).toBeInTheDocument()
    expect(screen.getByTestId('date-field-Warranty Expiration')).toBeInTheDocument()
    expect(screen.getByTestId('date-field-Installation Date')).toBeInTheDocument()
  })

  it('should handle machine serial number input change', async () => {
    const user = userEvent.setup()
    render(<WarrantyAcquisitionStep />)

    const serialInput = screen.getByPlaceholderText('Serial number')
    await user.type(serialInput, 'SN123456')

    // When typing, onChange is called multiple times with each character
    // Verify that it was called with the correct field name
    expect(mockOnInputChange).toHaveBeenCalled()
    expect(mockOnInputChange).toHaveBeenCalledWith('machine_serial_number', expect.any(String))
  })

  it('should handle product number input change', async () => {
    const user = userEvent.setup()
    render(<WarrantyAcquisitionStep />)

    const productInput = screen.getByPlaceholderText('Product number')
    await user.type(productInput, 'PN789012')

    // When typing, onChange is called multiple times with each character
    // Verify that it was called with the correct field name
    expect(mockOnInputChange).toHaveBeenCalled()
    expect(mockOnInputChange).toHaveBeenCalledWith('product_number', expect.any(String))
  })

  it('should handle acquisition date change', async () => {
    const user = userEvent.setup()
    render(<WarrantyAcquisitionStep />)

    const dateInput = screen.getByTestId('date-input-Acquisition Date')
    await user.type(dateInput, '2024-01-01')

    expect(mockOnInputChange).toHaveBeenCalledWith('acquisition_date', '2024-01-01')
  })

  it('should handle warranty expiration date change', async () => {
    const user = userEvent.setup()
    render(<WarrantyAcquisitionStep />)

    const dateInput = screen.getByTestId('date-input-Warranty Expiration')
    await user.type(dateInput, '2025-12-31')

    expect(mockOnInputChange).toHaveBeenCalledWith('warranty_expiration', '2025-12-31')
  })

  it('should handle installation date change', async () => {
    const user = userEvent.setup()
    render(<WarrantyAcquisitionStep />)

    const dateInput = screen.getByTestId('date-input-Installation Date')
    await user.type(dateInput, '2024-02-01')

    expect(mockOnInputChange).toHaveBeenCalledWith('installation_date', '2024-02-01')
  })

  it('should display field errors', () => {
    mockUseAssetForm.mockReturnValue({
      fieldErrors: {
        acquisition_date: 'Invalid date',
        warranty_expiration: 'Invalid date',
        installation_date: 'Invalid date',
      },
    })

    render(<WarrantyAcquisitionStep />)

    expect(screen.getByTestId('error-Acquisition Date')).toBeInTheDocument()
    // Multiple error messages exist, so use getAllByText
    const errorMessages = screen.getAllByText('Invalid date')
    expect(errorMessages.length).toBeGreaterThan(0)
  })

  it('should handle existing values', () => {
    mockUseWarrantyAcquisitionStep.mockReturnValue({
      formData: {
        machine_serial_number: 'SN123456',
        product_number: 'PN789012',
        acquisition_date: '2024-01-01',
        warranty_expiration: '2025-12-31',
        installation_date: '2024-02-01',
      },
      onInputChange: mockOnInputChange,
    })

    render(<WarrantyAcquisitionStep />)

    expect(screen.getByDisplayValue('SN123456')).toBeInTheDocument()
    expect(screen.getByDisplayValue('PN789012')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025-12-31')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument()
  })
})


/**
 * Component tests for components/apps/assets/shared/steps/BasicDetailsStep.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - Form fields
 * - Category selection
 * - Impact level selection
 * - Vendor selection
 * - Notes input
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { BasicDetailsStep } from '@/components/apps/assets/shared/steps/BasicDetailsStep'

// Mock hooks
jest.mock('@/components/apps/assets/hooks/useFormDataFetch', () => ({
  useBasicDetailsStep: jest.fn(),
}))

jest.mock('@/components/apps/assets/shared/form/AssetFormContext', () => ({
  useAssetForm: jest.fn(),
}))

// Mock form components
jest.mock('@/components/apps/assets/shared/form', () => ({
  FormField: ({ label, children, error }: any) => (
    <div data-testid={`form-field-${label}`}>
      <label>{label}</label>
      {error && <span data-testid={`error-${label}`}>{error}</span>}
      {children}
    </div>
  ),
  SelectField: ({ label, value, onChange, options, placeholder, error }: any) => (
    <div data-testid={`select-field-${label}`}>
      <label>{label}</label>
      {error && <span data-testid={`error-${label}`}>{error}</span>}
      <select
        data-testid={`select-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
  VendorField: ({ label, value, onChange, error }: any) => (
    <div data-testid={`vendor-field-${label}`}>
      <label>{label}</label>
      {error && <span data-testid={`error-${label}`}>{error}</span>}
      <input
        data-testid={`vendor-input-${label}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}))

describe('BasicDetailsStep', () => {
  const mockOnInputChange = jest.fn()
  const mockUseBasicDetailsStep = require('@/components/apps/assets/hooks/useFormDataFetch').useBasicDetailsStep
  const mockUseAssetForm = require('@/components/apps/assets/shared/form/AssetFormContext').useAssetForm

  const mockCategories = [
    { id: 1, name: 'Laptop' },
    { id: 2, name: 'Desktop' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseBasicDetailsStep.mockReturnValue({
      formData: {
        name: '',
        category: null,
        asset_tag: '',
        impact: null,
        vendor: null,
        notes: '',
      },
      onInputChange: mockOnInputChange,
    })

    mockUseAssetForm.mockReturnValue({
      fieldErrors: {},
      categories: mockCategories,
    })
  })

  it('should render component with title', () => {
    render(<BasicDetailsStep />)

    expect(screen.getByText('Basic Details')).toBeInTheDocument()
  })

  it('should render name field', () => {
    render(<BasicDetailsStep />)

    expect(screen.getByTestId('form-field-Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Asset name')).toBeInTheDocument()
  })

  it('should render category select field', () => {
    render(<BasicDetailsStep />)

    expect(screen.getByTestId('select-field-Asset Type')).toBeInTheDocument()
  })

  it('should render asset tag field', () => {
    render(<BasicDetailsStep />)

    expect(screen.getByTestId('form-field-Asset Tag')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tag')).toBeInTheDocument()
  })

  it('should render impact level buttons', () => {
    render(<BasicDetailsStep />)

    expect(screen.getByTestId('form-field-Impact')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should render vendor field', () => {
    render(<BasicDetailsStep />)

    expect(screen.getByTestId('vendor-field-Vendor')).toBeInTheDocument()
  })

  it('should render notes field', () => {
    render(<BasicDetailsStep />)

    expect(screen.getByTestId('form-field-Notes')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Add notes')).toBeInTheDocument()
  })

  it('should handle name input change', async () => {
    const user = userEvent.setup()
    render(<BasicDetailsStep />)

    const nameInput = screen.getByPlaceholderText('Asset name')
    await user.type(nameInput, 'Test Asset')

    expect(mockOnInputChange).toHaveBeenCalledWith('name', 'T')
  })

  it('should handle category selection', async () => {
    const user = userEvent.setup()
    render(<BasicDetailsStep />)

    const categorySelect = screen.getByTestId('select-Asset Type')
    await user.selectOptions(categorySelect, '1')

    expect(mockOnInputChange).toHaveBeenCalledWith('category', '1')
  })

  it('should handle impact level selection', async () => {
    const user = userEvent.setup()
    render(<BasicDetailsStep />)

    const impactButton = screen.getByText('2')
    await user.click(impactButton)

    expect(mockOnInputChange).toHaveBeenCalledWith('impact', 2)
  })

  it('should display field errors', () => {
    mockUseAssetForm.mockReturnValue({
      fieldErrors: {
        name: 'Name is required',
        category: 'Category is required',
      },
      categories: mockCategories,
    })

    render(<BasicDetailsStep />)

    expect(screen.getByTestId('error-Name')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('should handle category as object', () => {
    mockUseBasicDetailsStep.mockReturnValue({
      formData: {
        name: 'Test',
        category: { id: 1 },
        asset_tag: '',
        impact: null,
        vendor: null,
        notes: '',
      },
      onInputChange: mockOnInputChange,
    })

    render(<BasicDetailsStep />)

    const categorySelect = screen.getByTestId('select-Asset Type')
    expect(categorySelect).toHaveValue('1')
  })

  it('should handle category as number', () => {
    mockUseBasicDetailsStep.mockReturnValue({
      formData: {
        name: 'Test',
        category: 2,
        asset_tag: '',
        impact: null,
        vendor: null,
        notes: '',
      },
      onInputChange: mockOnInputChange,
    })

    render(<BasicDetailsStep />)

    const categorySelect = screen.getByTestId('select-Asset Type')
    expect(categorySelect).toHaveValue('2')
  })

  it('should handle vendor as number', () => {
    mockUseBasicDetailsStep.mockReturnValue({
      formData: {
        name: 'Test',
        category: null,
        asset_tag: '',
        impact: null,
        vendor: 5,
        notes: '',
      },
      onInputChange: mockOnInputChange,
    })

    render(<BasicDetailsStep />)

    const vendorInput = screen.getByTestId('vendor-input-Vendor')
    expect(vendorInput).toHaveValue('5')
  })

  it('should handle vendor as object', () => {
    mockUseBasicDetailsStep.mockReturnValue({
      formData: {
        name: 'Test',
        category: null,
        asset_tag: '',
        impact: null,
        vendor: { id: 3 },
        notes: '',
      },
      onInputChange: mockOnInputChange,
    })

    render(<BasicDetailsStep />)

    const vendorInput = screen.getByTestId('vendor-input-Vendor')
    expect(vendorInput).toHaveValue('3')
  })

  it('should show loading state when categories are loading', () => {
    mockUseAssetForm.mockReturnValue({
      fieldErrors: {},
      categories: [],
    })

    render(<BasicDetailsStep />)

    expect(screen.getByText('Loading categories...')).toBeInTheDocument()
  })
})


/**
 * Component tests for components/apps/assets/shared/steps/CostDepreciationStep.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - Custom lifecycle selection
 * - Currency fields
 * - Useful life input
 * - PO number input
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { CostDepreciationStep } from '@/components/apps/assets/shared/steps/CostDepreciationStep'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// Mock hooks
jest.mock('@/components/apps/assets/hooks/useFormDataFetch', () => ({
  useCostDepreciationStep: jest.fn(),
  useFormLifecyclesFetch: jest.fn(),
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
  CurrencyField: ({ label, value, onChange, error }: any) => (
    <div data-testid={`currency-field-${label}`}>
      <label>{label}</label>
      {error && <span data-testid={`error-${label}`}>{error}</span>}
      <input
        data-testid={`currency-input-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}))

describe('CostDepreciationStep', () => {
  const mockOnInputChange = jest.fn()
  const mockUseCostDepreciationStep = require('@/components/apps/assets/hooks/useFormDataFetch').useCostDepreciationStep
  const mockUseFormLifecyclesFetch = require('@/components/apps/assets/hooks/useFormDataFetch').useFormLifecyclesFetch
  const mockUseAssetForm = require('@/components/apps/assets/shared/form/AssetFormContext').useAssetForm

  const mockLifecycles = [
    { id: 1, name: 'Standard Lifecycle' },
    { id: 2, name: 'Extended Lifecycle' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseCostDepreciationStep.mockReturnValue({
      formData: {
        custom_lifecycle: null,
        purchase_price: '',
        replacement_cost: '',
        salvage_value: '',
        useful_life_years: null,
        approaching_eol_months: null,
        po_number: '',
      },
      onInputChange: mockOnInputChange,
    })

    mockUseFormLifecyclesFetch.mockReturnValue({
      customLifecycles: mockLifecycles,
      loading: false,
      error: null,
    })

    mockUseAssetForm.mockReturnValue({
      fieldErrors: {},
    })
  })

  it('should render component with title', () => {
    render(<CostDepreciationStep />)

    expect(screen.getByText('Cost Depreciation')).toBeInTheDocument()
  })

  it('should render custom lifecycle select', () => {
    render(<CostDepreciationStep />)

    expect(screen.getByText('Custom Lifecycle')).toBeInTheDocument()
    expect(screen.getByText('Select a custom lifecycle')).toBeInTheDocument()
  })

  it('should render currency fields', () => {
    render(<CostDepreciationStep />)

    expect(screen.getByTestId('currency-field-Purchase Price')).toBeInTheDocument()
    expect(screen.getByTestId('currency-field-Replacement Cost')).toBeInTheDocument()
    expect(screen.getByTestId('currency-field-Salvage Value')).toBeInTheDocument()
  })

  it('should render useful life field', () => {
    render(<CostDepreciationStep />)

    expect(screen.getByTestId('form-field-Useful Life')).toBeInTheDocument()
    // Multiple inputs have placeholder '0', so use getAllByPlaceholderText
    const inputsWithPlaceholder0 = screen.getAllByPlaceholderText('0')
    expect(inputsWithPlaceholder0.length).toBeGreaterThan(0)
    expect(screen.getByText('Years')).toBeInTheDocument()
  })

  it('should render approaching EOL field', () => {
    render(<CostDepreciationStep />)

    expect(screen.getByTestId('form-field-Approaching End-of-Life')).toBeInTheDocument()
    expect(screen.getByText('Months')).toBeInTheDocument()
  })

  it('should render PO number field', () => {
    render(<CostDepreciationStep />)

    expect(screen.getByTestId('form-field-PO#')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Purchase order number')).toBeInTheDocument()
  })

  it('should handle custom lifecycle selection', async () => {
    const user = userEvent.setup()
    render(<CostDepreciationStep />)

    const lifecycleSelect = screen.getByRole('combobox')
    await user.selectOptions(lifecycleSelect, '1')

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should handle custom lifecycle clear', async () => {
    const user = userEvent.setup()
    mockUseCostDepreciationStep.mockReturnValue({
      formData: {
        custom_lifecycle: { id: 1, name: 'Standard Lifecycle' },
        purchase_price: '',
        replacement_cost: '',
        salvage_value: '',
        useful_life_years: null,
        approaching_eol_months: null,
        po_number: '',
      },
      onInputChange: mockOnInputChange,
    })

    render(<CostDepreciationStep />)

    const lifecycleSelect = screen.getByRole('combobox')
    await user.selectOptions(lifecycleSelect, '')

    expect(mockOnInputChange).toHaveBeenCalledWith('custom_lifecycle', null)
  })

  it('should handle purchase price change', async () => {
    const user = userEvent.setup()
    render(<CostDepreciationStep />)

    const purchasePriceInput = screen.getByTestId('currency-input-Purchase Price')
    await user.clear(purchasePriceInput)
    await user.type(purchasePriceInput, '1000')

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should handle useful life change', async () => {
    const user = userEvent.setup()
    render(<CostDepreciationStep />)

    // Multiple inputs have placeholder '0', so use getAllByPlaceholderText and take the first (Useful Life)
    const inputsWithPlaceholder0 = screen.getAllByPlaceholderText('0')
    expect(inputsWithPlaceholder0.length).toBeGreaterThan(0)
    const usefulLifeInput = inputsWithPlaceholder0[0]
    await user.type(usefulLifeInput, '5')

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should handle PO number change', async () => {
    const user = userEvent.setup()
    render(<CostDepreciationStep />)

    const poInput = screen.getByPlaceholderText('Purchase order number')
    await user.type(poInput, 'PO-12345')

    // When typing, onChange is called multiple times with each character
    // Verify that it was called with the correct field name
    expect(mockOnInputChange).toHaveBeenCalled()
    expect(mockOnInputChange).toHaveBeenCalledWith('po_number', expect.any(String))
  })

  it('should show loading state for lifecycles', () => {
    mockUseFormLifecyclesFetch.mockReturnValue({
      customLifecycles: [],
      loading: true,
      error: null,
    })

    render(<CostDepreciationStep />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show error state for lifecycles', () => {
    mockUseFormLifecyclesFetch.mockReturnValue({
      customLifecycles: [],
      loading: false,
      error: 'Failed to load',
    })

    render(<CostDepreciationStep />)

    expect(screen.getByText('Error loading custom lifecycles')).toBeInTheDocument()
  })

  it('should display field errors', () => {
    mockUseAssetForm.mockReturnValue({
      fieldErrors: {
        purchase_price: 'Invalid price',
        useful_life_years: 'Invalid value',
      },
    })

    render(<CostDepreciationStep />)

    expect(screen.getByTestId('error-Purchase Price')).toBeInTheDocument()
    expect(screen.getByText('Invalid price')).toBeInTheDocument()
  })

  it('should navigate to settings when customize button clicked', async () => {
    const user = userEvent.setup()
    const mockPush = jest.fn()
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
    })

    render(<CostDepreciationStep />)

    const customizeButton = screen.getByText('Customize Lifecycles')
    await user.click(customizeButton)

    expect(mockPush).toHaveBeenCalledWith('/settings')
  })
})


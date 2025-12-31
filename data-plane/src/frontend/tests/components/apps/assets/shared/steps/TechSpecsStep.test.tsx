/**
 * Component tests for components/apps/assets/shared/steps/TechSpecsStep.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - MAC address input
 * - IP address input
 * - Manufacturer input
 * - Model input
 * - Tags field
 */

import { render, screen, fireEvent } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { TechSpecsStep } from '@/components/apps/assets/shared/steps/TechSpecsStep'

// Mock hooks
jest.mock('@/components/apps/assets/hooks/useFormDataFetch', () => ({
  useTechSpecsStep: jest.fn(),
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
  TagField: ({ label, value, onChange }: any) => (
    <div data-testid={`tag-field-${label}`}>
      <label>{label}</label>
      <input
        data-testid={`tag-input-${label}`}
        value={JSON.stringify(value || [])}
        onChange={(e) => onChange(JSON.parse(e.target.value))}
      />
    </div>
  ),
}))

describe('TechSpecsStep', () => {
  const mockOnInputChange = jest.fn()
  const mockUseTechSpecsStep = require('@/components/apps/assets/hooks/useFormDataFetch').useTechSpecsStep
  const mockUseAssetForm = require('@/components/apps/assets/shared/form/AssetFormContext').useAssetForm

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseTechSpecsStep.mockReturnValue({
      formData: {
        mac_address: '',
        ip_address: '',
        manufacturer: '',
        model: '',
        tags: [],
      },
      onInputChange: mockOnInputChange,
    })

    mockUseAssetForm.mockReturnValue({
      fieldErrors: {},
    })
  })

  it('should render component with title', () => {
    render(<TechSpecsStep />)

    expect(screen.getByText('Tech Specs')).toBeInTheDocument()
  })

  it('should render MAC address field', () => {
    render(<TechSpecsStep />)

    expect(screen.getByTestId('form-field-MAC Addresses')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter MAC addresses/i)).toBeInTheDocument()
  })

  it('should render IP address field', () => {
    render(<TechSpecsStep />)

    expect(screen.getByTestId('form-field-IP Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('192.168.1.1')).toBeInTheDocument()
  })

  it('should render manufacturer field', () => {
    render(<TechSpecsStep />)

    expect(screen.getByTestId('form-field-Manufacturer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Manufacturer')).toBeInTheDocument()
  })

  it('should render model field', () => {
    render(<TechSpecsStep />)

    expect(screen.getByTestId('form-field-Model')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Model')).toBeInTheDocument()
  })

  it('should render tags field', () => {
    render(<TechSpecsStep />)

    expect(screen.getByTestId('tag-field-Tags')).toBeInTheDocument()
  })

  it('should handle MAC address input change', async () => {
    const user = userEvent.setup()
    render(<TechSpecsStep />)

    const macInput = screen.getByPlaceholderText(/enter MAC addresses/i)
    await user.type(macInput, '00:1B:44:11:3A:B7')

    expect(mockOnInputChange).toHaveBeenCalledWith('mac_address', '0')
  })

  it('should handle IP address input change', async () => {
    const user = userEvent.setup()
    render(<TechSpecsStep />)

    const ipInput = screen.getByPlaceholderText('192.168.1.1')
    await user.type(ipInput, '192.168.1.100')

    expect(mockOnInputChange).toHaveBeenCalledWith('ip_address', '1')
  })

  it('should handle manufacturer input change', async () => {
    const user = userEvent.setup()
    render(<TechSpecsStep />)

    const manufacturerInput = screen.getByPlaceholderText('Manufacturer')
    await user.type(manufacturerInput, 'Dell')

    expect(mockOnInputChange).toHaveBeenCalledWith('manufacturer', 'D')
  })

  it('should handle model input change', async () => {
    const user = userEvent.setup()
    render(<TechSpecsStep />)

    const modelInput = screen.getByPlaceholderText('Model')
    await user.type(modelInput, 'Latitude 7420')

    expect(mockOnInputChange).toHaveBeenCalledWith('model', 'L')
  })

  it('should display field errors', () => {
    mockUseAssetForm.mockReturnValue({
      fieldErrors: {
        mac_address: 'Invalid MAC address',
        ip_address: 'Invalid IP address',
      },
    })

    render(<TechSpecsStep />)

    expect(screen.getByTestId('error-MAC Addresses')).toBeInTheDocument()
    expect(screen.getByText('Invalid MAC address')).toBeInTheDocument()
    expect(screen.getByTestId('error-IP Address')).toBeInTheDocument()
    expect(screen.getByText('Invalid IP address')).toBeInTheDocument()
  })

  it('should handle existing values', () => {
    mockUseTechSpecsStep.mockReturnValue({
      formData: {
        mac_address: '00:1B:44:11:3A:B7',
        ip_address: '192.168.1.1',
        manufacturer: 'Dell',
        model: 'Latitude 7420',
        tags: [{ id: 1, name: 'laptop' }],
      },
      onInputChange: mockOnInputChange,
    })

    render(<TechSpecsStep />)

    expect(screen.getByDisplayValue('00:1B:44:11:3A:B7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('192.168.1.1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dell')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Latitude 7420')).toBeInTheDocument()
  })

  it('should handle tags change', () => {
    render(<TechSpecsStep />)

    const tagInput = screen.getByTestId('tag-input-Tags')
    const newTags = [{ id: 1, name: 'test' }]
    
    // Use fireEvent to set the complete value at once (avoiding JSON parse errors from partial typing)
    fireEvent.change(tagInput, {
      target: { value: JSON.stringify(newTags) },
    })

    expect(mockOnInputChange).toHaveBeenCalledWith('tags', newTags)
  })
})


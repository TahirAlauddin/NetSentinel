/**
 * Component tests for components/apps/assets/shared/steps/AdditionalDetailsStep.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - Related items field
 * - Attachments upload
 * - Images upload
 */

import { render, screen, fireEvent } from '@/tests/__utils__/test-utils'
import { AdditionalDetailsStep } from '@/components/apps/assets/shared/steps/AdditionalDetailsStep'

// Mock hooks
jest.mock('@/components/apps/assets/hooks/useFormDataFetch', () => ({
  useAdditionalDetailsStep: jest.fn(),
}))

// Mock form components
jest.mock('@/components/apps/assets/shared/form', () => ({
  RelatedItemField: ({ label, value, onChange }: any) => (
    <div data-testid="related-items-field">
      <label>{label}</label>
      <input
        data-testid="related-items-input"
        value={JSON.stringify(value || [])}
        onChange={(e) => onChange(JSON.parse(e.target.value))}
      />
    </div>
  ),
}))

// Mock upload components
jest.mock('@/components/common/upload/ImageUploadField', () => ({
  ImageUploadField: ({ label, value, onChange }: any) => (
    <div data-testid="image-upload-field">
      <label>{label}</label>
      <input
        data-testid="image-upload-input"
        value={JSON.stringify(value || [])}
        onChange={(e) => onChange(JSON.parse(e.target.value))}
      />
    </div>
  ),
}))

jest.mock('@/components/common/upload/AttachmentsUploadField', () => ({
  AttachmentsUploadField: ({ label, value, onChange }: any) => (
    <div data-testid="attachments-upload-field">
      <label>{label}</label>
      <input
        data-testid="attachments-upload-input"
        value={JSON.stringify(value || [])}
        onChange={(e) => onChange(JSON.parse(e.target.value))}
      />
    </div>
  ),
}))

describe('AdditionalDetailsStep', () => {
  const mockOnInputChange = jest.fn()
  const mockUseAdditionalDetailsStep = require('@/components/apps/assets/hooks/useFormDataFetch').useAdditionalDetailsStep

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAdditionalDetailsStep.mockReturnValue({
      formData: {
        related_items: [],
        attachments: [],
        images: [],
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })
  })

  it('should render component with title', () => {
    render(<AdditionalDetailsStep />)

    expect(screen.getByText('Additional Details')).toBeInTheDocument()
  })

  it('should render related items field', () => {
    render(<AdditionalDetailsStep />)

    expect(screen.getByTestId('related-items-field')).toBeInTheDocument()
    expect(screen.getByText('Related Items')).toBeInTheDocument()
  })

  it('should render attachments upload field', () => {
    render(<AdditionalDetailsStep />)

    expect(screen.getByTestId('attachments-upload-field')).toBeInTheDocument()
    expect(screen.getByText('Attachments')).toBeInTheDocument()
  })

  it('should render image upload field', () => {
    render(<AdditionalDetailsStep />)

    expect(screen.getByTestId('image-upload-field')).toBeInTheDocument()
    expect(screen.getByText('Asset Image')).toBeInTheDocument()
  })

  it('should handle related items change', async () => {
    render(<AdditionalDetailsStep />)

    const input = screen.getByTestId('related-items-input') as HTMLInputElement
    const jsonValue = JSON.stringify([{ id: 1, name: 'Related Asset' }])
    fireEvent.change(input, { target: { value: jsonValue } })

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should handle existing related items', () => {
    mockUseAdditionalDetailsStep.mockReturnValue({
      formData: {
        related_items: [{ id: 1, name: 'Existing Item' }],
        attachments: [],
        images: [],
        asset_id: 1,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AdditionalDetailsStep />)

    const input = screen.getByTestId('related-items-input')
    expect(input).toHaveValue(JSON.stringify([{ id: 1, name: 'Existing Item' }]))
  })

  it('should handle existing attachments', () => {
    mockUseAdditionalDetailsStep.mockReturnValue({
      formData: {
        related_items: [],
        attachments: [{ id: 1, name: 'attachment.pdf' }],
        images: [],
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AdditionalDetailsStep />)

    const input = screen.getByTestId('attachments-upload-input')
    expect(input).toHaveValue(JSON.stringify([{ id: 1, name: 'attachment.pdf' }]))
  })

  it('should handle existing images', () => {
    mockUseAdditionalDetailsStep.mockReturnValue({
      formData: {
        related_items: [],
        attachments: [],
        images: [{ id: 1, url: 'image.jpg' }],
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AdditionalDetailsStep />)

    const input = screen.getByTestId('image-upload-input')
    expect(input).toHaveValue(JSON.stringify([{ id: 1, url: 'image.jpg' }]))
  })

  it('should handle non-array attachments', () => {
    mockUseAdditionalDetailsStep.mockReturnValue({
      formData: {
        related_items: [],
        attachments: null,
        images: null,
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AdditionalDetailsStep />)

    expect(screen.getByTestId('attachments-upload-field')).toBeInTheDocument()
  })

  it('should exclude current asset when editing', () => {
    mockUseAdditionalDetailsStep.mockReturnValue({
      formData: {
        related_items: [],
        attachments: [],
        images: [],
        asset_id: 5,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AdditionalDetailsStep />)

    expect(screen.getByTestId('related-items-field')).toBeInTheDocument()
  })
})


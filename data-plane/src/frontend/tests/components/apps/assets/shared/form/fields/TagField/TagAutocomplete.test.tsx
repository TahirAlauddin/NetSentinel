/**
 * Component tests for components/apps/assets/shared/form/fields/TagField/TagAutocomplete.tsx
 * 
 * Tests cover:
 * - Autocomplete rendering
 * - Tag selection
 * - Empty state
 * - Color display
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { TagAutocomplete } from '@/components/apps/assets/shared/form/fields/TagField/TagAutocomplete'
import { Tag } from '@/types/assets'

describe('TagAutocomplete', () => {
  const mockTags: Tag[] = [
    { id: 1, name: 'Tag 1' },
    { id: 2, name: 'Tag 2' },
    { id: 3, name: 'Tag 3' },
  ]

  const mockOnSelect = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when tags array is empty', () => {
    const { container } = render(
      <TagAutocomplete
        tags={[]}
        inputValue="test"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render all tags', () => {
    render(
      <TagAutocomplete
        tags={mockTags}
        inputValue="tag"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Tag 1')).toBeInTheDocument()
    expect(screen.getByText('Tag 2')).toBeInTheDocument()
    expect(screen.getByText('Tag 3')).toBeInTheDocument()
  })

  it('should call onSelect and onClose when tag is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TagAutocomplete
        tags={mockTags}
        inputValue="tag"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    const tagButton = screen.getByText('Tag 1')
    await user.click(tagButton)

    expect(mockOnSelect).toHaveBeenCalledWith(mockTags[0])
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should display color indicators for tags', () => {
    const { container } = render(
      <TagAutocomplete
        tags={mockTags}
        inputValue="tag"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    const colorIndicators = container.querySelectorAll('.w-3.h-3.rounded-full')
    expect(colorIndicators.length).toBe(3)
  })
})


/**
 * Component tests for components/apps/assets/shared/form/fields/TagField/TagPill.tsx
 * 
 * Tests cover:
 * - Tag pill rendering
 * - Remove functionality
 * - Color assignment
 * - Invalid props handling
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { TagPill } from '@/components/apps/assets/shared/form/fields/TagField/TagPill'

describe('TagPill', () => {
  const mockOnRemove = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render tag name', () => {
    render(<TagPill tagId={1} tagName="Test Tag" index={0} onRemove={mockOnRemove} />)

    expect(screen.getByText('Test Tag')).toBeInTheDocument()
  })

  it('should call onRemove when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<TagPill tagId={1} tagName="Test Tag" index={0} onRemove={mockOnRemove} />)

    const removeButton = screen.getByLabelText('Remove Test Tag tag')
    await user.click(removeButton)

    expect(mockOnRemove).toHaveBeenCalledWith(1)
  })

  it('should not render when tagId is invalid', () => {
    const { container } = render(
      <TagPill tagId={undefined as any} tagName="Test Tag" index={0} onRemove={mockOnRemove} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should not render when tagName is empty', () => {
    const { container } = render(
      <TagPill tagId={1} tagName="" index={0} onRemove={mockOnRemove} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should apply color based on index', () => {
    const { container } = render(
      <TagPill tagId={1} tagName="Test Tag" index={0} onRemove={mockOnRemove} />
    )

    const pill = container.firstChild as HTMLElement
    expect(pill).toHaveStyle({ backgroundColor: expect.any(String) })
  })
})


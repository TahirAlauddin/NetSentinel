/**
 * Component tests for components/ui/label.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('should render label element', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('should associate label with input using htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Username</Label>
        <input id="test-input" />
      </>
    )
    const label = screen.getByText('Username')
    const input = screen.getByLabelText('Username')
    expect(label).toHaveAttribute('for', 'test-input')
    expect(input).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<Label className="custom-class">Custom Label</Label>)
    const label = container.querySelector('[data-slot="label"]')
    expect(label?.className).toContain('custom-class')
  })

  it('should render with required indicator when needed', () => {
    render(
      <Label>
        Email <span aria-label="required">*</span>
      </Label>
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('required')).toBeInTheDocument()
  })
})



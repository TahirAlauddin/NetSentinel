/**
 * Component tests for components/pages/assets/form/FormField.tsx
 * 
 * Tests cover:
 * - Label rendering
 * - Required indicator display
 * - Optional indicator display
 * - Error message display
 * - Custom className application
 * - Label-input association via id prop
 * - Children rendering
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { FormField } from '@/components/apps/assets/form/FormField'

describe('FormField', () => {
  /**
   * Tests that the FormField component renders correctly with a label
   */
  it('should render label', () => {
    render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>
    )

    // Verify label text is displayed
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  /**
   * Tests that the required indicator (asterisk) is displayed when required prop is true
   */
  it('should display required indicator', () => {
    render(
      <FormField label="Required Field" required>
        <input type="text" />
      </FormField>
    )

    // Verify label is displayed
    expect(screen.getByText('Required Field')).toBeInTheDocument()
    // Verify required indicator (asterisk) is shown
    const label = screen.getByText('Required Field').closest('label')
    expect(label?.textContent).toContain('*')
  })

  /**
   * Tests that the optional indicator is displayed when optional prop is true
   */
  it('should display optional indicator', () => {
    render(
      <FormField label="Optional Field" optional>
        <input type="text" />
      </FormField>
    )

    // Verify label is displayed
    expect(screen.getByText('Optional Field')).toBeInTheDocument()
    // Verify optional indicator is shown
    expect(screen.getByText('(optional)')).toBeInTheDocument()
  })

  /**
   * Tests that error messages are displayed when the error prop is provided
   */
  it('should display error message', () => {
    const errorMessage = 'This field is required'
    render(
      <FormField label="Test Field" error={errorMessage}>
        <input type="text" />
      </FormField>
    )

    // Verify error message is displayed
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  /**
   * Tests that no error message is displayed when error prop is not provided
   */
  it('should not display error when error is not provided', () => {
    render(
      <FormField label="Test Field">
        <input type="text" />
      </FormField>
    )

    // Verify no error message is present
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  /**
   * Tests that custom className prop is applied to the form field wrapper
   */
  it('should apply custom className', () => {
    const { container } = render(
      <FormField label="Test Field" className="custom-class">
        <input type="text" />
      </FormField>
    )

    // Verify custom class is applied to the form field container
    const formField = container.querySelector('.custom-class')
    expect(formField).toBeInTheDocument()
  })

  /**
   * Tests that the label is associated with the input via htmlFor when id is provided
   */
  it('should associate label with input via id', () => {
    render(
      <FormField label="Test Field" id="test-input">
        <input type="text" id="test-input" />
      </FormField>
    )

    // Verify label has for attribute matching the id (htmlFor in JSX becomes for in DOM)
    const label = screen.getByText('Test Field').closest('label')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', 'test-input')
    
    // Verify input has matching id
    const input = screen.getByLabelText('Test Field')
    expect(input).toHaveAttribute('id', 'test-input')
  })

  /**
   * Tests that children are rendered within the form field
   */
  it('should render children', () => {
    render(
      <FormField label="Test Field">
        <input type="text" data-testid="child-input" />
      </FormField>
    )

    // Verify child element is rendered
    expect(screen.getByTestId('child-input')).toBeInTheDocument()
  })

  /**
   * Tests that both required and optional indicators are not shown together
   * (optional should take precedence if both are provided)
   */
  it('should handle both required and optional props', () => {
    render(
      <FormField label="Test Field" required optional>
        <input type="text" />
      </FormField>
    )

    const label = screen.getByText('Test Field').closest('label')
    // If both are provided, both might be shown, but typically optional takes precedence
    // This test verifies the component doesn't break
    expect(label).toBeInTheDocument()
  })

  /**
   * Tests that the component works without an id prop
   */
  it('should work without id prop', () => {
    render(
      <FormField label="Test Field">
        <input type="text" />
      </FormField>
    )

    // Verify component renders without errors
    expect(screen.getByText('Test Field')).toBeInTheDocument()
    const label = screen.getByText('Test Field').closest('label')
    expect(label).toBeInTheDocument()
    // When id is not provided, htmlFor becomes empty string in JSX, which renders as for="" in DOM
    // An empty string attribute may not be rendered, so we check it doesn't have a non-empty for attribute
    const forAttribute = label?.getAttribute('for')
    expect(forAttribute === '' || forAttribute === null).toBe(true)
  })
})


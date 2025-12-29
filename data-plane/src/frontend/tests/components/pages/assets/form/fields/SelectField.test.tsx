/**
 * Component tests for components/pages/assets/form/fields/SelectField.tsx
 * 
 * Tests cover SelectField-specific functionality:
 * - Select element rendering
 * - Option rendering and display
 * - User interaction (option selection)
 * - Value display and updates
 * - Error styling on select element
 * - Visual elements (dropdown arrow icon)
 * - Placeholder option handling
 * - Size prop functionality
 * - Required attribute handling
 * 
 * Note: Label, optional/required indicators, error message display, and className
 * are tested in FormField.test.tsx since SelectField uses FormField internally.
 */

import { render, screen, fireEvent } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { SelectField } from '@/components/apps/assets/form/fields/SelectField'

describe('SelectField', () => {
  // Mock function to track onChange callback invocations
  const mockOnChange = jest.fn()

  // Sample options for testing
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  beforeEach(() => {
    // Clear mock function calls before each test
    mockOnChange.mockClear()
  })

  /**
   * Tests that the select element is rendered
   */
  it('should render select element', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    // Verify select element is present (query by role)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  /**
   * Tests that all provided options are rendered in the select element
   */
  it('should display options', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    // Verify all options are rendered
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })


  /**
   * Tests that the component correctly displays the value prop in the select element
   */
  it('should display current value', () => {
    render(
      <SelectField
        label="Test Select"
        value="option2"
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    // Verify the select displays the provided value
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('option2')
  })

  /**
   * Tests that the onChange callback is invoked with the correct value
   * when the user selects a different option
   */
  it('should handle selection', async () => {
    const user = userEvent.setup()
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    const select = screen.getByRole('combobox')
    // Simulate user selecting an option
    await user.selectOptions(select, 'option1')

    // Verify onChange was called with the selected option value
    expect(mockOnChange).toHaveBeenCalledWith('option1')
  })

  /**
   * Tests that the component correctly handles multiple sequential option changes
   * and that onChange is called for each change with the correct values
   */
  it('should handle multiple selections', async () => {
    const user = userEvent.setup()
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    const select = screen.getByRole('combobox')
    
    // Simulate first selection
    await user.selectOptions(select, 'option1')
    expect(mockOnChange).toHaveBeenCalledWith('option1')
    expect(mockOnChange).toHaveBeenCalledTimes(1)

    // Simulate second selection
    await user.selectOptions(select, 'option2')
    expect(mockOnChange).toHaveBeenCalledWith('option2')
    // Verify onChange was called twice total
    expect(mockOnChange).toHaveBeenCalledTimes(2)
  })

  /**
   * Tests that error styling is applied to the select when error prop is provided
   * (Error message display is tested in FormField.test.tsx)
   */
  it('should apply error styling to select when error is provided', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        error="Please select an option"
      />
    )

    // Verify error styling (red border) is applied to select
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('border-red-500')
  })

  /**
   * Tests that default styling is applied when error prop is not provided
   */
  it('should apply default styling when error is not provided', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    const select = screen.getByRole('combobox')
    // Verify default styling (gray border) is applied
    expect(select).toHaveClass('border-gray-300')
  })

  /**
   * Tests that the dropdown arrow icon is rendered
   */
  it('should render dropdown arrow icon', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    // Find the dropdown arrow SVG element within the select's parent container
    const select = screen.getByRole('combobox')
    const arrowIcon = select.parentElement?.querySelector('svg')
    expect(arrowIcon).toBeInTheDocument()
  })


  /**
   * Tests that the component correctly handles empty string values
   * Note: When value="" is provided without a placeholder, the browser
   * automatically selects the first option. To test empty value, we need a placeholder.
   */
  it('should handle empty value with placeholder', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        placeholder="Select an option"
      />
    )

    // Verify select value is empty when empty string is provided with placeholder
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  /**
   * Tests that when value="" is provided without a placeholder,
   * the browser defaults to selecting the first option
   */
  it('should default to first option when value is empty and no placeholder', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    // Browser automatically selects first option when value doesn't match any option
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('option1') // First option value
    expect(select.options[0].selected).toBe(true)
  })

  /**
   * Tests that the component correctly updates the displayed value
   * when the value prop changes (e.g., from parent component state updates)
   */
  it('should handle value updates', () => {
    const { rerender } = render(
      <SelectField
        label="Test Select"
        value="option1"
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    // Verify initial value is displayed
    let select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('option1')

    // Update the component with a new value
    rerender(
      <SelectField
        label="Test Select"
        value="option3"
        onChange={mockOnChange}
        options={mockOptions}
      />
    )

    // Verify the select value updates to reflect the new prop
    select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('option3')
  })

  /**
   * Tests that a placeholder option is rendered when the placeholder prop is provided
   */
  it('should display placeholder option', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        placeholder="Select an option"
      />
    )

    // Verify placeholder option is displayed
    expect(screen.getByText('Select an option')).toBeInTheDocument()
    // Verify placeholder option has empty value
    const placeholderOption = screen.getByText('Select an option') as HTMLOptionElement
    expect(placeholderOption.value).toBe('')
  })

  /**
   * Tests that the size prop correctly sets the size attribute on the select element
   * Note: When size > 1, the select has role 'listbox' instead of 'combobox'
   */
  it('should apply size prop', () => {
    const { container } = render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        size={3}
      />
    )

    // Query select element directly since size > 1 changes role to 'listbox'
    const select = container.querySelector('select') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    // Verify size attribute is applied
    expect(select).toHaveAttribute('size', '3')
  })

  /**
   * Tests that the required attribute is set on the select element when required prop is true
   */
  it('should set required attribute when required prop is true', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        required
      />
    )

    // Verify required attribute is set
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toHaveAttribute('required')
  })

  /**
   * Tests that the required attribute is not set when required prop is false or undefined
   */
  it('should not set required attribute when required prop is false', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        required={false}
      />
    )

    // Verify required attribute is not set
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).not.toHaveAttribute('required')
  })

  /**
   * Tests that the component handles empty options array gracefully
   */
  it('should handle empty options array', () => {
    render(
      <SelectField
        label="Test Select"
        value=""
        onChange={mockOnChange}
        options={[]}
      />
    )

    // Verify select is rendered even with no options
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    // Verify no option elements are present (except placeholder if provided)
    const options = select.querySelectorAll('option')
    expect(options.length).toBe(0)
  })
})


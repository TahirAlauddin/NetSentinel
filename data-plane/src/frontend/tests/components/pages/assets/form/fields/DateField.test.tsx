/**
 * Component tests for components/pages/assets/form/fields/DateField.tsx
 * 
 * Tests cover DateField-specific functionality:
 * - Date input type and rendering
 * - Value display and updates
 * - User interaction (date selection)
 * - Visual elements (calendar icon, styling)
 * 
 * Note: Label, optional/required indicators, error display, and className
 * are tested in FormField.test.tsx since DateField uses FormField internally.
 */

import { render, screen, fireEvent } from '@/tests/__utils__/test-utils'
import { DateField } from '@/components/apps/assets/shared/form/fields/DateField'

describe('DateField', () => {
  // Mock function to track onChange callback invocations
  const mockOnChange = jest.fn()

  beforeEach(() => {
    // Clear mock function calls before each test
    mockOnChange.mockClear()
  })

  /**
   * Tests that the input element has the correct type attribute for date picker
   */
  it('should render date input with correct type', () => {
  render(
      <DateField
        label="Test Date"
        id="test-date"
        value=""
        onChange={mockOnChange}
      />
    )

    // Verify input has correct type attribute for date picker
    const input = screen.getByLabelText('Test Date')
    expect(input).toHaveAttribute('type', 'date')
  })

  /**
   * Tests that the component correctly displays the value prop in the input field
   */
  it('should display current value', () => {
    const testDate = '2024-01-15'
    render(
      <DateField
        label="Test Date"
        id="test-date"
        value={testDate}
        onChange={mockOnChange}
      />
    )

    // Verify the input displays the provided value
    const input = screen.getByLabelText('Test Date') as HTMLInputElement
    expect(input.value).toBe(testDate)
  })


  /**
   * Tests that error styling is applied to the input when error prop is provided
   * (Error message display is tested in FormField.test.tsx)
   */
  it('should apply error styling to input when error is provided', () => {
    render(
      <DateField
        label="Test Date"
        id="test-date"
        value=""
        onChange={mockOnChange}
        error="Please enter a valid date"
      />
    )

    // Verify error styling (red border) is applied to input
    const input = screen.getByLabelText('Test Date')
    expect(input).toHaveClass('border-red-500')
  })

  /**
   * Tests that default styling is applied when error prop is not provided
   */
  it('should apply default styling when error is not provided', () => {
    render(
      <DateField
        label="Test Date"
        id="test-date"
        value=""
        onChange={mockOnChange}
      />
    )

    const input = screen.getByLabelText('Test Date')
    // Verify default styling (gray border) is applied
    expect(input).toHaveClass('border-gray-300')
    // Verify error styling is not present
    expect(input).not.toHaveClass('border-red-500')
  })

  /**
   * Tests that the calendar icon (from lucide-react) is rendered
   * within the input container
   */
  it('should render calendar icon', () => {
    render(
      <DateField
        label="Test Date"
        id="test-date"
        value=""
        onChange={mockOnChange}
      />
    )

    // Find the calendar icon SVG element within the input's parent container
    const calendarIcon = screen.getByLabelText('Test Date').parentElement?.querySelector('svg')
    expect(calendarIcon).toBeInTheDocument()
  })


  /**
   * Tests that the component correctly handles empty string values
   */
  it('should handle empty value', () => {
    render(
      <DateField
        label="Test Date"
        id="test-date"
        value=""
        onChange={mockOnChange}
      />
    )

    // Verify input value is empty when empty string is provided
    const input = screen.getByLabelText('Test Date') as HTMLInputElement
    expect(input.value).toBe('')
  })

  /**
   * Tests that the component correctly updates the displayed value
   * when the value prop changes (e.g., from parent component state updates)
   */
  it('should handle date value updates', () => {
    const { rerender } = render(
      <DateField
        label="Test Date"
        id="test-date"
        value="2024-01-15"
        onChange={mockOnChange}
      />
    )

    // Verify initial value is displayed
    let input = screen.getByLabelText('Test Date') as HTMLInputElement
    expect(input.value).toBe('2024-01-15')

    // Update the component with a new value
    rerender(
      <DateField
        label="Test Date"
        id="test-date"
        value="2024-12-31"
        onChange={mockOnChange}
      />
    )

    // Verify the input value updates to reflect the new prop
    input = screen.getByLabelText('Test Date') as HTMLInputElement
    expect(input.value).toBe('2024-12-31')
  })

  /**
   * Tests that the component correctly handles multiple sequential date changes
   * and that onChange is called for each change with the correct values
   */
  it('should handle multiple date changes', () => {
    render(
      <DateField
        label="Test Date"
        id="test-date"
        value=""
        onChange={mockOnChange}
      />
    )

    const input = screen.getByLabelText('Test Date')
    
    // Simulate first date change
    fireEvent.change(input, { target: { value: '2024-01-15' } })
    expect(mockOnChange).toHaveBeenCalledWith('2024-01-15')
    expect(mockOnChange).toHaveBeenCalledTimes(1)

    // Simulate second date change
    fireEvent.change(input, { target: { value: '2024-12-31' } })
    expect(mockOnChange).toHaveBeenCalledWith('2024-12-31')
    // Verify onChange was called twice total
    expect(mockOnChange).toHaveBeenCalledTimes(2)
  })
})


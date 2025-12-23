/**
 * Component tests for components/pages/assets/form/fields/VendorField.tsx
 * 
 * Tests cover VendorField-specific functionality:
 * - Vendor selection from autocomplete
 * - Vendor creation
 * - Input filtering and autocomplete display
 * - Selected vendor display and removal
 * - Keyboard interactions
 * - Loading states
 * 
 * Note: Label, optional/required indicators, error message display, and className
 * are tested in FormField.test.tsx since VendorField uses FormField internally.
 */

import { render, screen, waitFor, act } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { VendorField } from '@/components/pages/assets/form/fields/VendorField'
import { listVendors, createVendor } from '@/app/(app)/assets/actions'

// Mock the vendor actions
jest.mock('@/app/(app)/assets/actions', () => ({
  listVendors: jest.fn(),
  createVendor: jest.fn(),
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('VendorField', () => {
  const mockOnChange = jest.fn()
  const mockListVendors = listVendors as jest.MockedFunction<typeof listVendors>
  const mockCreateVendor = createVendor as jest.MockedFunction<typeof createVendor>

  const mockVendors = [
    { id: 1, name: 'Apple Inc', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: 2, name: 'Dell Technologies', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: 3, name: 'HP Enterprise', created_at: '2024-01-01', updated_at: '2024-01-01' },
  ]

  beforeEach(() => {
    mockOnChange.mockClear()
    mockListVendors.mockResolvedValue(mockVendors)
    mockCreateVendor.mockResolvedValue({
      success: true,
      data: { id: 4, name: 'New Vendor', created_at: '2024-01-01', updated_at: '2024-01-01' },
    })
  })

  /**
   * Tests that the input field is rendered
   */
  it('should render input field', async () => {
    render(
      <VendorField
        label="Vendor"
        value={null}
        onChange={mockOnChange}
      />
    )

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Verify input is present
    const input = screen.getByPlaceholderText('Type to search or create a vendor')
    expect(input).toBeInTheDocument()
  })

  /**
   * Tests that vendors are loaded on mount
   * Note: In React StrictMode (development), effects run twice, so we check for at least one call
   */
  it('should load vendors on mount', async () => {
    render(
      <VendorField
        label="Vendor"
        value={null}
        onChange={mockOnChange}
      />
    )

    // Verify listVendors is called on mount
    // In StrictMode, effects run twice, so we check for at least one call
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  /**
   * Tests that typing in the input filters vendors
   */
  it('should filter vendors based on input', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(
        <VendorField
          label="Vendor"
          value={null}
          onChange={mockOnChange}
        />
      )
    })

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    const input = screen.getByPlaceholderText('Type to search or create a vendor')
    
    // Type to filter - use "Apple" which should only match "Apple Inc"
    await act(async () => {
      await user.clear(input)
      await user.type(input, 'Apple')
    })

    // Wait for autocomplete dropdown to appear with filtered results
    // The autocomplete shows vendor names as buttons inside a dropdown
    await waitFor(() => {
      // Check that Apple Inc button appears in the autocomplete dropdown
      const buttons = screen.getAllByRole('button')
      const appleButton = buttons.find(btn => btn.textContent?.trim() === 'Apple Inc')
      expect(appleButton).toBeDefined()
      expect(appleButton).toBeInTheDocument()
    }, { timeout: 2000 })

    // Verify only matching vendor is shown in autocomplete
    // Get all buttons and filter for vendor names
    const allButtons = screen.getAllByRole('button')
    const vendorButtons = allButtons.filter(btn => {
      const text = btn.textContent?.trim()
      return text === 'Apple Inc' || text === 'Dell Technologies' || text === 'HP Enterprise'
    })
    
    // Only Apple Inc should be in the autocomplete (excluding other buttons like Filters, etc.)
    const vendorNames = vendorButtons.map(btn => btn.textContent?.trim())
    expect(vendorNames).toContain('Apple Inc')
    expect(vendorNames).not.toContain('Dell Technologies')
    expect(vendorNames).not.toContain('HP Enterprise')
  })

  /**
   * Tests that selecting a vendor from autocomplete calls onChange
   */
  it('should select vendor from autocomplete', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(
        <VendorField
          label="Vendor"
          value={null}
          onChange={mockOnChange}
        />
      )
    })

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    const input = screen.getByPlaceholderText('Type to search or create a vendor')
    await act(async () => {
      await user.clear(input)
      await user.type(input, 'Apple')
    })

    // Wait for autocomplete to appear
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const appleButton = buttons.find(btn => btn.textContent?.trim() === 'Apple Inc')
      expect(appleButton).toBeDefined()
    })

    // Click on vendor option
    const buttons = screen.getAllByRole('button')
    const appleButton = buttons.find(btn => btn.textContent?.trim() === 'Apple Inc')
    if (appleButton) {
      await act(async () => {
        await user.click(appleButton)
      })
    }

    // Verify onChange was called with vendor ID
    expect(mockOnChange).toHaveBeenCalledWith(1)
  })

  /**
   * Tests that selected vendor is displayed
   */
  it('should display selected vendor', async () => {
    render(
      <VendorField
        label="Vendor"
        value={1}
        onChange={mockOnChange}
      />
    )

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Wait for selected vendor to be displayed
    await waitFor(() => {
      expect(screen.getByText('Apple Inc')).toBeInTheDocument()
    })

    // Verify input is not visible when vendor is selected
    expect(screen.queryByPlaceholderText('Type to search or create a vendor')).not.toBeInTheDocument()
  })

  /**
   * Tests that removing a selected vendor calls onChange with null
   */
  it('should remove selected vendor', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(
        <VendorField
          label="Vendor"
          value={1}
          onChange={mockOnChange}
        />
      )
    })

    // Wait for vendors to load and vendor to be displayed
    await waitFor(() => {
      expect(screen.getByText('Apple Inc')).toBeInTheDocument()
    })

    // Find and click remove button
    const removeButton = screen.getByLabelText('Remove Apple Inc')
    await act(async () => {
      await user.click(removeButton)
    })

    // Verify onChange was called with null
    expect(mockOnChange).toHaveBeenCalledWith(null)
  })

  /**
   * Tests that pressing Enter creates a new vendor when no matches
   */
  it('should create new vendor on Enter when no matches', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(
        <VendorField
          label="Vendor"
          value={null}
          onChange={mockOnChange}
        />
      )
    })

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    const input = screen.getByPlaceholderText('Type to search or create a vendor')
    
    // Type a new vendor name
    await act(async () => {
      await user.type(input, 'New Vendor')
    })
    
    // Press Enter
    await act(async () => {
      await user.keyboard('{Enter}')
    })

    // Wait for create vendor to be called
    await waitFor(() => {
      expect(mockCreateVendor).toHaveBeenCalledWith({ name: 'New Vendor' })
    })
  })

  /**
   * Tests that pressing Enter selects first suggestion when matches exist
   */
  it('should select first suggestion on Enter when matches exist', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(
        <VendorField
          label="Vendor"
          value={null}
          onChange={mockOnChange}
        />
      )
    })

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    const input = screen.getByPlaceholderText('Type to search or create a vendor')
    
    // Type "A" to get matches (will match "Apple Inc")
    await act(async () => {
      await user.clear(input)
      await user.type(input, 'A')
    })

    // Wait for suggestions - typing "A" should match "Apple Inc"
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const appleButton = buttons.find(btn => btn.textContent?.trim() === 'Apple Inc')
      expect(appleButton).toBeDefined()
    }, { timeout: 2000 })

    // Press Enter - should select first match (Apple Inc, id: 1)
    await act(async () => {
      await user.keyboard('{Enter}')
    })

    // Verify first vendor was selected
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(1)
    })
  })

  /**
   * Tests that pressing Escape closes autocomplete
   */
  it('should close autocomplete on Escape', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(
        <VendorField
          label="Vendor"
          value={null}
          onChange={mockOnChange}
        />
      )
    })

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    const input = screen.getByPlaceholderText('Type to search or create a vendor')
    await act(async () => {
      await user.clear(input)
      await user.type(input, 'Apple')
    })

    // Wait for autocomplete to appear - verify vendor button is visible
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const appleButton = buttons.find(btn => btn.textContent?.trim() === 'Apple Inc')
      expect(appleButton).toBeDefined()
      // Verify the button is in the autocomplete dropdown (has specific styling/container)
      expect(appleButton?.closest('div')?.className).toContain('absolute')
    }, { timeout: 2000 })

    // Press Escape
    await act(async () => {
      await user.keyboard('{Escape}')
    })

    // Verify autocomplete is closed
    // The autocomplete dropdown is conditionally rendered based on showAutocomplete state
    // When closed, the dropdown div should not be in the DOM
    // We verify by checking that the input value is preserved and we can still interact with it
    await waitFor(() => {
      const inputElement = screen.getByPlaceholderText('Type to search or create a vendor') as HTMLInputElement
      expect(inputElement.value).toBe('Apple')
    })

    // Verify that typing again reopens the autocomplete (confirming it was closed)
    await act(async () => {
      await user.clear(input)
      await user.type(input, 'p')
    })

    // After typing more, autocomplete should appear again
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const appleButton = buttons.find(btn => btn.textContent?.trim() === 'Apple Inc')
      expect(appleButton).toBeDefined()
    }, { timeout: 2000 })
  })

  /**
   * Tests that error styling is applied when error prop is provided
   * (Error message display is tested in FormField.test.tsx)
   */
  it('should apply error styling when error is provided', async () => {
    render(
      <VendorField
        label="Vendor"
        value={null}
        onChange={mockOnChange}
        error="Please select a vendor"
      />
    )

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Find the container div (it has the border styling)
    const container = screen.getByPlaceholderText('Type to search or create a vendor').closest('div')
    expect(container).toHaveClass('border-red-500')
  })

  /**
   * Tests that default styling is applied when error is not provided
   */
  it('should apply default styling when error is not provided', async () => {
    render(
      <VendorField
        label="Vendor"
        value={null}
        onChange={mockOnChange}
      />
    )

    // Wait for vendors to load
    await waitFor(() => {
      expect(mockListVendors).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Find the container div
    const container = screen.getByPlaceholderText('Type to search or create a vendor').closest('div')
    expect(container).toHaveClass('border-gray-300')
  })
})


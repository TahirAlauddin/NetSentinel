/**
 * Component tests for components/locations/add-location-form.tsx
 * 
 * Tests cover:
 * - Form rendering
 * - Form submission
 * - Input fields
 * - Submit button states
 * - Required fields
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import AddLocationForm from '@/components/locations/add-location-form'

describe('AddLocationForm', () => {
  const mockHandleAddLocation = jest.fn((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={false} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address 1/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address 2/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type of building/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/main point of entry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/demarcation point/i)).toBeInTheDocument()
  })

  it('should have required fields marked', () => {
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={false} />)

    const nameInput = screen.getByLabelText(/name/i)
    const address1Input = screen.getByLabelText(/address 1/i)

    expect(nameInput).toBeRequired()
    expect(address1Input).toBeRequired()
  })

  it('should call handleAddLocation on form submit', async () => {
    const user = userEvent.setup()
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={false} />)

    // Fill required fields
    await user.type(screen.getByLabelText(/name/i), 'Test Location')
    await user.type(screen.getByLabelText(/address 1/i), '123 Main St')

    const submitButton = screen.getByRole('button', { name: /add location/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockHandleAddLocation).toHaveBeenCalledTimes(1)
    })
  })

  it('should disable submit button when submitting', () => {
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={true} />)

    const submitButton = screen.getByRole('button', { name: /adding location/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show submitting text when submitting', () => {
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={true} />)

    expect(screen.getByText('Adding Location...')).toBeInTheDocument()
    expect(screen.queryByText('Add Location')).not.toBeInTheDocument()
  })

  it('should show normal text when not submitting', () => {
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={false} />)

    expect(screen.getByText('Add Location')).toBeInTheDocument()
    expect(screen.queryByText('Adding Location...')).not.toBeInTheDocument()
  })

  it('should display note about unique location combination', () => {
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={false} />)

    expect(screen.getByText(/each location must have a unique combination of city and address/i)).toBeInTheDocument()
  })

  it('should allow input in all fields', async () => {
    const user = userEvent.setup()
    render(<AddLocationForm handleAddLocation={mockHandleAddLocation} submitting={false} />)

    await user.type(screen.getByLabelText(/name/i), 'Test Location')
    await user.type(screen.getByLabelText(/alias/i), 'Test Alias')
    await user.type(screen.getByLabelText(/city/i), 'New York')

    expect(screen.getByLabelText(/name/i)).toHaveValue('Test Location')
    expect(screen.getByLabelText(/alias/i)).toHaveValue('Test Alias')
    expect(screen.getByLabelText(/city/i)).toHaveValue('New York')
  })
})


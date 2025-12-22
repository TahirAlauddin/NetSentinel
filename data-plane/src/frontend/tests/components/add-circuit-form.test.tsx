/**
 * Component tests for components/add-circuit-form.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import AddCircuitForm from '@/components/add-circuit-form'

const mockLocations = [
  {
    id: 1,
    name: 'New York Office',
    alias: 'NYC',
    city: 'New York',
    address1: '123 Main St',
    address2: '',
    state: 'NY',
    zip_code: '10001',
    phone: '555-0100',
    longitude: -74.006,
    latitude: 40.7128,
    type_building: 'Office',
    mpoe: 'MPOE-001',
    dmarc: 'DMARC-001',
  },
  {
    id: 2,
    name: 'Los Angeles Office',
    alias: 'LAX',
    city: 'Los Angeles',
    address1: '456 Oak Ave',
    address2: '',
    state: 'CA',
    zip_code: '90001',
    phone: '555-0200',
    longitude: -118.2437,
    latitude: 34.0522,
    type_building: 'Office',
    mpoe: 'MPOE-002',
    dmarc: 'DMARC-002',
  },
]

describe('AddCircuitForm', () => {
  it('should render all form fields', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/carrier/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/speed/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/circuit id/i)).toBeInTheDocument()
  })

  it('should render submit button', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByRole('button', { name: /add circuit/i })).toBeInTheDocument()
  })

  it('should show "Adding Circuit..." when submitting', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={true}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByRole('button', { name: /adding circuit.../i })).toBeInTheDocument()
  })

  it('should disable submit button when submitting', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={true}
        locations={mockLocations}
      />
    )
    
    const submitButton = screen.getByRole('button', { name: /adding circuit.../i })
    expect(submitButton).toBeDisabled()
  })

  it('should disable submit button when no locations are available', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={[]}
      />
    )
    
    const submitButton = screen.getByRole('button', { name: /add circuit/i })
    expect(submitButton).toBeDisabled()
  })

  it('should render location options', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByText('Select a location')).toBeInTheDocument()
    expect(screen.getByText('New York - 123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Los Angeles - 456 Oak Ave')).toBeInTheDocument()
  })

  it('should show message when no locations are available', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={[]}
      />
    )
    
    expect(screen.getByText(/no locations available/i)).toBeInTheDocument()
  })

  it('should call handleAddCircuit on form submission', async () => {
    const user = userEvent.setup()
    const handleAddCircuit = jest.fn((e) => e.preventDefault())
    
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    const locationSelect = screen.getByLabelText(/location/i)
    const carrierInput = screen.getByLabelText(/carrier/i)
    const speedInput = screen.getByLabelText(/speed/i)
    
    await user.selectOptions(locationSelect, '1')
    await user.type(carrierInput, 'Verizon')
    await user.type(speedInput, '1000')
    
    const submitButton = screen.getByRole('button', { name: /add circuit/i })
    await user.click(submitButton)
    
    expect(handleAddCircuit).toHaveBeenCalled()
  })

  it('should have required fields', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByLabelText(/location/i)).toBeRequired()
    expect(screen.getByLabelText(/carrier/i)).toBeRequired()
    expect(screen.getByLabelText(/speed/i)).toBeRequired()
  })

  it('should have correct input types', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    const speedInput = screen.getByLabelText(/speed/i) as HTMLInputElement
    expect(speedInput.type).toBe('number')
    expect(speedInput.min).toBe('1')
  })

  it('should display placeholder text', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByPlaceholderText('Verizon, AT&T, etc.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('1000')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('VZ-12345')).toBeInTheDocument()
  })

  it('should display note about location requirement', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByText(/each circuit must be associated with a location/i)).toBeInTheDocument()
  })

  it('should format location options correctly', () => {
    const handleAddCircuit = jest.fn()
    render(
      <AddCircuitForm
        handleAddCircuit={handleAddCircuit}
        submitting={false}
        locations={mockLocations}
      />
    )
    
    const locationSelect = screen.getByLabelText(/location/i) as HTMLSelectElement
    const options = Array.from(locationSelect.options).map(opt => opt.text)
    
    expect(options).toContain('Select a location')
    expect(options).toContain('New York - 123 Main St')
    expect(options).toContain('Los Angeles - 456 Oak Ave')
  })
})



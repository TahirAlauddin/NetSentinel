/**
 * Component tests for components/locations/locations-list.tsx
 * 
 * Tests cover:
 * - Table rendering with locations
 * - Empty state display
 * - Location data display
 * - Error state handling
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import LocationsList from '@/components/locations/locations-list'
import { LocationRecord } from '@/types/locations'

describe('LocationsList', () => {
  const mockLocations: LocationRecord[] = [
    {
      id: 1,
      name: 'Location 1',
      alias: 'Loc1',
      city: 'New York',
      address1: '123 Main St',
      address2: 'Suite 100',
      state: 'NY',
      zip_code: '10001',
      phone: '123-456-7890',
      longitude: -74.006,
      latitude: 40.7128,
      type_building: 'Office',
      mpoe: 'Main Entrance',
      dmarc: 'Main Exit',
    },
    {
      id: 2,
      name: 'Location 2',
      alias: 'Loc2',
      city: 'Los Angeles',
      address1: '456 Oak Ave',
      address2: '',
      state: 'CA',
      zip_code: '90001',
      phone: '987-654-3210',
      longitude: -118.2437,
      latitude: 34.0522,
      type_building: 'Warehouse',
      mpoe: 'Side Door',
      dmarc: 'Back Door',
    },
  ]

  it('should render table headers', () => {
    render(<LocationsList locations={mockLocations} />)

    expect(screen.getByText('City')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()
    expect(screen.getByText('Circuits')).toBeInTheDocument()
    expect(screen.getByText('ID')).toBeInTheDocument()
  })

  it('should render locations data', () => {
    render(<LocationsList locations={mockLocations} />)

    expect(screen.getByText('New York')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Los Angeles')).toBeInTheDocument()
    expect(screen.getByText('456 Oak Ave')).toBeInTheDocument()
  })

  it('should display location IDs', () => {
    render(<LocationsList locations={mockLocations} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should display circuits count (hardcoded to 0)', () => {
    render(<LocationsList locations={mockLocations} />)

    const circuitsCells = screen.getAllByText('0')
    expect(circuitsCells.length).toBeGreaterThan(0)
  })

  it('should show empty state when locations array is empty', () => {
    render(<LocationsList locations={[]} />)

    expect(screen.getByText('No locations found')).toBeInTheDocument()
  })

  it('should show error message when locations is not an array', () => {
    render(<LocationsList locations={null as unknown as LocationRecord[]} />)

    expect(screen.getByText('Failed to load locations')).toBeInTheDocument()
  })

  it('should render all location rows', () => {
    render(<LocationsList locations={mockLocations} />)

    // Should have 2 data rows plus header
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(3) // 1 header + 2 data rows
  })
})


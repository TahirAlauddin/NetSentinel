/**
 * Component tests for components/locations/location-map.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - Placeholder text display
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import LocationMap from '@/components/locations/location-map'

describe('LocationMap', () => {
  it('should render map visualization placeholder', () => {
    render(<LocationMap />)

    expect(screen.getByText('Map visualization')).toBeInTheDocument()
  })

  it('should have correct styling classes', () => {
    const { container } = render(<LocationMap />)

    const mapDiv = container.firstChild as HTMLElement
    expect(mapDiv).toHaveClass('bg-[oklch(0.6_0.1_200)]')
    expect(mapDiv).toHaveClass('rounded-lg')
    expect(mapDiv).toHaveClass('h-96')
  })
})


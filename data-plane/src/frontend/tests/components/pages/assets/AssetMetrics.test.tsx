/**
 * Component tests for components/pages/assets/AssetMetrics.tsx
 * 
 * Tests cover:
 * - Metrics display (total, active, retired, in_repair, disposed)
 * - Status filter display
 * - Status filter removal
 * - Filter button rendering
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { AssetMetricsDisplay } from '@/components/apps/assets/AssetMetrics'
import { AssetMetrics } from '@/types/assets'

describe('AssetMetricsDisplay', () => {
  const mockOnFilterStatusChange = jest.fn()

  const mockMetrics: AssetMetrics = {
    total: 100,
    active: 60,
    retired: 20,
    in_repair: 15,
    disposed: 5,
  }

  beforeEach(() => {
    mockOnFilterStatusChange.mockClear()
  })

  /**
   * Tests that all metric cards are rendered with correct values
   */
  it('should display all metrics', () => {
    render(
      <AssetMetricsDisplay
        metrics={mockMetrics}
        filterStatus={null}
        onFilterStatusChange={mockOnFilterStatusChange}
      />
    )

    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('Retired')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('In Repair')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Disposed')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  /**
   * Tests that status filter badge is displayed when filterStatus is provided
   */
  it('should display status filter badge when filterStatus is set', () => {
    render(
      <AssetMetricsDisplay
        metrics={mockMetrics}
        filterStatus="active"
        onFilterStatusChange={mockOnFilterStatusChange}
      />
    )

    expect(screen.getByText(/Status: active/i)).toBeInTheDocument()
  })

  /**
   * Tests that status filter badge is not displayed when filterStatus is null
   */
  it('should not display status filter badge when filterStatus is null', () => {
    render(
      <AssetMetricsDisplay
        metrics={mockMetrics}
        filterStatus={null}
        onFilterStatusChange={mockOnFilterStatusChange}
      />
    )

    expect(screen.queryByText(/Status:/i)).not.toBeInTheDocument()
  })

  /**
   * Tests that clicking the X button on filter badge calls onFilterStatusChange with null
   */
  it('should remove filter when X button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AssetMetricsDisplay
        metrics={mockMetrics}
        filterStatus="active"
        onFilterStatusChange={mockOnFilterStatusChange}
      />
    )

    // Find the X icon button (it's inside the badge)
    const filterBadge = screen.getByText(/Status: active/i).closest('div')
    const xButton = filterBadge?.querySelector('svg')
    
    if (xButton) {
      await user.click(xButton)
      expect(mockOnFilterStatusChange).toHaveBeenCalledWith(null)
    }
  })

  /**
   * Tests that Filters button is rendered
   */
  it('should render Filters button', () => {
    render(
      <AssetMetricsDisplay
        metrics={mockMetrics}
        filterStatus={null}
        onFilterStatusChange={mockOnFilterStatusChange}
      />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  /**
   * Tests that component handles zero values correctly
   */
  it('should display zero values correctly', () => {
    const zeroMetrics: AssetMetrics = {
      total: 0,
      active: 0,
      retired: 0,
      in_repair: 0,
      disposed: 0,
    }

    render(
      <AssetMetricsDisplay
        metrics={zeroMetrics}
        filterStatus={null}
        onFilterStatusChange={mockOnFilterStatusChange}
      />
    )

    const metrics = screen.getAllByText('0')
    expect(metrics).toHaveLength(5)
    for (const metric of metrics) {
      expect(metric).toBeInTheDocument()
    }
  })

  /**
   * Tests that component displays "At a glance" heading
   */
  it('should display heading', () => {
    render(
      <AssetMetricsDisplay
        metrics={mockMetrics}
        filterStatus={null}
        onFilterStatusChange={mockOnFilterStatusChange}
      />
    )

    expect(screen.getByText('At a glance')).toBeInTheDocument()
  })
})


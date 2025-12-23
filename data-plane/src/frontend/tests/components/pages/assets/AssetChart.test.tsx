/**
 * Component tests for components/pages/assets/AssetChart.tsx
 * 
 * Tests cover:
 * - Chart rendering with assets
 * - Category distribution calculation
 * - Empty state handling
 * - Total assets display
 * - Legend rendering
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { AssetChart } from '@/components/pages/assets/AssetChart'
import { mockAsset, mockAssetCategory } from '@/tests/__fixtures__/api-responses'
import { Asset } from '@/types/assets'

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe('AssetChart', () => {
  /**
   * Tests that chart renders with heading
   */
  it('should render chart with heading', () => {
    render(<AssetChart assets={[]} totalAssets={0} />)

    expect(screen.getByText('Category Distribution')).toBeInTheDocument()
  })

  /**
   * Tests that total assets count is displayed
   */
  it('should display total assets count', () => {
    render(<AssetChart assets={[]} totalAssets={100} />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Assets')).toBeInTheDocument()
  })

  /**
   * Tests that category distribution is calculated and displayed
   */
  it('should display category distribution', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: 1, category: { ...mockAssetCategory, name: 'Laptop' } },
      { ...mockAsset, id: 2, category: { ...mockAssetCategory, name: 'Laptop' } },
      { ...mockAsset, id: 3, category: { ...mockAssetCategory, name: 'Desktop' } },
    ]

    render(<AssetChart assets={assets} totalAssets={3} />)

    // Category names should be displayed in legend
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('Desktop')).toBeInTheDocument()
    
    // Category counts should be displayed
    expect(screen.getByText('2')).toBeInTheDocument() // Laptop count
    expect(screen.getByText('1')).toBeInTheDocument() // Desktop count
  })

  /**
   * Tests that chart handles empty assets array
   */
  it('should handle empty assets array', () => {
    render(<AssetChart assets={[]} totalAssets={0} />)

    // Should show "No Assets" in chart data
    expect(screen.getByText('Category Distribution')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  /**
   * Tests that chart displays "Uncategorized" for assets without category
   */
  it('should display Uncategorized for assets without category', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: 1, category: null as any },
    ]

    render(<AssetChart assets={assets} totalAssets={1} />)

    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })

  /**
   * Tests that pie chart components are rendered
   */
  it('should render pie chart components', () => {
    const assets: Asset[] = [
      { ...mockAsset, id: 1, category: mockAssetCategory },
    ]

    render(<AssetChart assets={assets} totalAssets={1} />)

    // Check for mocked chart components
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  /**
   * Tests that multiple categories are displayed correctly
   */
  it('should display multiple categories correctly', () => {
    const category1 = { ...mockAssetCategory, id: 1, name: 'Category 1' }
    const category2 = { ...mockAssetCategory, id: 2, name: 'Category 2' }
    const category3 = { ...mockAssetCategory, id: 3, name: 'Category 3' }

    const assets: Asset[] = [
      { ...mockAsset, id: 1, category: category1 },
      { ...mockAsset, id: 2, category: category1 },
      { ...mockAsset, id: 3, category: category2 },
      { ...mockAsset, id: 4, category: category3 },
      { ...mockAsset, id: 5, category: category3 },
      { ...mockAsset, id: 6, category: category3 },
    ]

    render(<AssetChart assets={assets} totalAssets={6} />)

    expect(screen.getByText('Category 1')).toBeInTheDocument()
    expect(screen.getByText('Category 2')).toBeInTheDocument()
    expect(screen.getByText('Category 3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // Category 1 count
    expect(screen.getByText('1')).toBeInTheDocument() // Category 2 count
    expect(screen.getByText('3')).toBeInTheDocument() // Category 3 count
  })
})


/**
 * Component tests for components/ipam/subnet-views.tsx
 * 
 * Tests cover:
 * - Favorite button rendering in list view
 * - Favorite button rendering in grid view
 * - Favorite toggle functionality
 * - Favorite button styling (filled vs outline)
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { SubnetViews } from '@/components/apps/ipam/subnet-views'
import { Subnet } from '@/types/ipam'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

describe('SubnetViews', () => {
  const mockSubnet: Subnet = {
    id: 1,
    network: '192.168.1.0/24',
    description: 'Test subnet',
    group: 1,
    location: 1,
    is_ipv6: false,
    status: 'active',
    status_display: 'Active',
    child_subnets_count: 0,
    ip_addresses_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockSortOptions = {
    field: 'network' as const,
    direction: 'asc' as const,
  }

  const mockOnSort = jest.fn()
  const mockOnToggleFavorite = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('List View', () => {
    it('should render favorite button in list view', () => {
      render(
        <SubnetViews
          subnets={[mockSubnet]}
          viewMode="list"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // Find favorite buttons by title (there are 2: one in network column, one in actions column)
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
    })

    it('should show filled star when subnet is favorited in list view', () => {
      const favoritedSubnet = { ...mockSubnet, is_favorite: true }

      render(
        <SubnetViews
          subnets={[favoritedSubnet]}
          viewMode="list"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // There are 2 buttons (network column and actions column), get the first one
      const favoriteButtons = screen.getAllByTitle('Remove from favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
      // Check that the star icon has fill class
      const starIcon = favoriteButtons[0].querySelector('svg')
      expect(starIcon).toHaveClass('fill-current')
    })

    it('should show outline star when subnet is not favorited in list view', () => {
      const unfavoritedSubnet = { ...mockSubnet, is_favorite: false }

      render(
        <SubnetViews
          subnets={[unfavoritedSubnet]}
          viewMode="list"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // There are 2 buttons (network column and actions column), get the first one
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
      // Check that the star icon does not have fill class
      const starIcon = favoriteButtons[0].querySelector('svg')
      expect(starIcon).not.toHaveClass('fill-current')
    })

    it('should show outline star when subnet is_favorite is undefined in list view', () => {
      const subnetWithoutFavorite = { ...mockSubnet }
      delete subnetWithoutFavorite.is_favorite

      render(
        <SubnetViews
          subnets={[subnetWithoutFavorite]}
          viewMode="list"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // There are 2 buttons (network column and actions column), get the first one
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
      const starIcon = favoriteButtons[0].querySelector('svg')
      expect(starIcon).not.toHaveClass('fill-current')
    })

    it('should call onToggleFavorite when favorite button is clicked in list view', async () => {
      const user = userEvent.setup()

      render(
        <SubnetViews
          subnets={[mockSubnet]}
          viewMode="list"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // There are 2 buttons, click the first one (in network column)
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      await user.click(favoriteButtons[0])

      expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1)
      expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockSubnet)
    })

    it('should not render favorite button when onToggleFavorite is not provided in list view', () => {
      render(
        <SubnetViews
          subnets={[mockSubnet]}
          viewMode="list"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
        />
      )

      const favoriteButton = screen.queryByTitle('Add to favorites')
      expect(favoriteButton).not.toBeInTheDocument()
    })
  })

  describe('Grid View', () => {
    it('should render favorite button in grid view', () => {
      render(
        <SubnetViews
          subnets={[mockSubnet]}
          viewMode="grid"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // In grid view, there are 2 favorite buttons per subnet (network + status/actions)
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
    })

    it('should show filled star when subnet is favorited in grid view', () => {
      const favoritedSubnet = { ...mockSubnet, is_favorite: true }

      render(
        <SubnetViews
          subnets={[favoritedSubnet]}
          viewMode="grid"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // In grid view, there are 2 favorite buttons per subnet
      const favoriteButtons = screen.getAllByTitle('Remove from favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
      const starIcon = favoriteButtons[0].querySelector('svg')
      expect(starIcon).toHaveClass('fill-current')
    })

    it('should show outline star when subnet is not favorited in grid view', () => {
      const unfavoritedSubnet = { ...mockSubnet, is_favorite: false }

      render(
        <SubnetViews
          subnets={[unfavoritedSubnet]}
          viewMode="grid"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // In grid view, there are 2 favorite buttons per subnet
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
      const starIcon = favoriteButtons[0].querySelector('svg')
      expect(starIcon).not.toHaveClass('fill-current')
    })

    it('should show outline star when subnet is_favorite is undefined in grid view', () => {
      const subnetWithoutFavorite = { ...mockSubnet }
      delete subnetWithoutFavorite.is_favorite

      render(
        <SubnetViews
          subnets={[subnetWithoutFavorite]}
          viewMode="grid"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // In grid view, there are 2 favorite buttons per subnet
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      expect(favoriteButtons.length).toBeGreaterThan(0)
      const starIcon = favoriteButtons[0].querySelector('svg')
      expect(starIcon).not.toHaveClass('fill-current')
    })

    it('should call onToggleFavorite when favorite button is clicked in grid view', async () => {
      const user = userEvent.setup()

      render(
        <SubnetViews
          subnets={[mockSubnet]}
          viewMode="grid"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // In grid view, there are 2 favorite buttons per subnet, click the first one
      const favoriteButtons = screen.getAllByTitle('Add to favorites')
      await user.click(favoriteButtons[0])

      expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1)
      expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockSubnet)
    })

    it('should not render favorite button when onToggleFavorite is not provided in grid view', () => {
      render(
        <SubnetViews
          subnets={[mockSubnet]}
          viewMode="grid"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
        />
      )

      const favoriteButton = screen.queryByTitle('Add to favorites')
      expect(favoriteButton).not.toBeInTheDocument()
    })
  })

  describe('Multiple Subnets', () => {
    it('should render favorite buttons for all subnets', () => {
      const subnet1 = { ...mockSubnet, id: 1, network: '192.168.1.0/24' }
      const subnet2 = { ...mockSubnet, id: 2, network: '192.168.2.0/24', is_favorite: true }
      const subnet3 = { ...mockSubnet, id: 3, network: '192.168.3.0/24' }

      render(
        <SubnetViews
          subnets={[subnet1, subnet2, subnet3]}
          viewMode="list"
          sortOptions={mockSortOptions}
          onSort={mockOnSort}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // In list view, each subnet has 2 favorite buttons (network column + actions column)
      // subnet1: 2 "Add to favorites" buttons
      // subnet2: 2 "Remove from favorites" buttons  
      // subnet3: 2 "Add to favorites" buttons
      // Total: 4 "Add to favorites" buttons, 2 "Remove from favorites" buttons
      const addButtons = screen.getAllByTitle('Add to favorites')
      const removeButtons = screen.getAllByTitle('Remove from favorites')
      
      expect(addButtons.length).toBe(4) // 2 for subnet1 + 2 for subnet3
      expect(removeButtons.length).toBe(2) // 2 for subnet2 (network + actions)
    })
  })
})

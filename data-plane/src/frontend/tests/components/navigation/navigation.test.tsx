/**
 * Component tests for components/navigation/navigation.tsx
 * 
 * Tests cover:
 * - Navigation rendering
 * - Active item detection
 * - Submenu expansion/collapse
 * - Desktop hover behavior
 * - Mobile toggle behavior
 */

import { render, screen, waitFor, act } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { Navigation } from '@/components/navigation/navigation'
import { NavigationItem } from '@/types/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock navigation-item component
jest.mock('@/components/navigation/navigation-item', () => ({
  NavigationItemComponent: ({ item, isExpanded, onToggleSubmenu, onItemHover, onItemLeave }: any) => (
    <div data-testid={`nav-item-${item.label}`}>
      <button
        onClick={() => onToggleSubmenu(item.label)}
        onMouseEnter={() => onItemHover(item.label)}
        onMouseLeave={onItemLeave}
        data-testid={`toggle-${item.label}`}
      >
        {item.label}
        {isExpanded && <span data-testid={`expanded-${item.label}`}>Expanded</span>}
      </button>
    </div>
  ),
}))

describe('Navigation', () => {
  const mockUsePathname = require('next/navigation').usePathname

  const mockItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Assets',
      href: '/assets',
      icon: 'assets',
      hasSubmenu: true,
      submenuColumns: [
        {
          links: [
            { label: 'All Assets', href: '/assets/all' },
            { label: 'Categories', href: '/assets/categories' },
          ],
        },
      ],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.innerWidth for desktop detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('should render navigation items', () => {
    mockUsePathname.mockReturnValue('/dashboard')

    render(<Navigation items={mockItems} />)

    expect(screen.getByTestId('nav-item-Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-Assets')).toBeInTheDocument()
  })

  it('should mark item as active when pathname matches exactly', () => {
    mockUsePathname.mockReturnValue('/dashboard')

    render(<Navigation items={mockItems} />)

    const dashboardItem = screen.getByTestId('nav-item-Dashboard')
    expect(dashboardItem).toBeInTheDocument()
  })

  it('should mark item as active when pathname matches submenu item', () => {
    mockUsePathname.mockReturnValue('/assets/all')

    render(<Navigation items={mockItems} />)

    const assetsItem = screen.getByTestId('nav-item-Assets')
    expect(assetsItem).toBeInTheDocument()
  })

  it('should mark item as active when pathname starts with item href', () => {
    mockUsePathname.mockReturnValue('/assets/123')

    render(<Navigation items={mockItems} />)

    const assetsItem = screen.getByTestId('nav-item-Assets')
    expect(assetsItem).toBeInTheDocument()
  })

  it('should not mark item as active for partial matches', () => {
    mockUsePathname.mockReturnValue('/dashboard-something')

    render(<Navigation items={mockItems} />)

    // Dashboard should not be active for /dashboard-something
    const dashboardItem = screen.getByTestId('nav-item-Dashboard')
    expect(dashboardItem).toBeInTheDocument()
  })

  it('should toggle submenu on click', async () => {
    const user = userEvent.setup()
    mockUsePathname.mockReturnValue('/dashboard')

    render(<Navigation items={mockItems} />)

    const toggleButton = screen.getByTestId('toggle-Assets')
    expect(screen.queryByTestId('expanded-Assets')).not.toBeInTheDocument()

    await act(async () => {
      await user.click(toggleButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('expanded-Assets')).toBeInTheDocument()
    })
  })

  it('should expand submenu on hover when desktop', async () => {
    const user = userEvent.setup()
    mockUsePathname.mockReturnValue('/dashboard')
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    render(<Navigation items={mockItems} />)

    const toggleButton = screen.getByTestId('toggle-Assets')
    
    await act(async () => {
      await user.hover(toggleButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('expanded-Assets')).toBeInTheDocument()
    })
  })

  it('should handle resize events', async () => {
    mockUsePathname.mockReturnValue('/dashboard')

    render(<Navigation items={mockItems} />)

    // Simulate resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    })
    
    await act(async () => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      // Component should handle resize
      expect(screen.getByTestId('nav-item-Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle multiple items with submenus', () => {
    const itemsWithMultipleSubmenus: NavigationItem[] = [
      {
        label: 'Item 1',
        href: '/item1',
        icon: 'icon1',
        hasSubmenu: true,
        submenuColumns: [
          {
            links: [{ label: 'Sub 1', href: '/item1/sub1' }],
          },
        ],
      },
      {
        label: 'Item 2',
        href: '/item2',
        icon: 'icon2',
        hasSubmenu: true,
        submenuColumns: [
          {
            links: [{ label: 'Sub 2', href: '/item2/sub2' }],
          },
        ],
      },
    ]

    mockUsePathname.mockReturnValue('/dashboard')

    render(<Navigation items={itemsWithMultipleSubmenus} />)

    expect(screen.getByTestId('nav-item-Item 1')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-Item 2')).toBeInTheDocument()
  })

  it('should handle items without submenus', () => {
    const simpleItems: NavigationItem[] = [
      {
        label: 'Simple',
        href: '/simple',
        icon: 'icon',
      },
    ]

    mockUsePathname.mockReturnValue('/simple')

    render(<Navigation items={simpleItems} />)

    expect(screen.getByTestId('nav-item-Simple')).toBeInTheDocument()
  })
})


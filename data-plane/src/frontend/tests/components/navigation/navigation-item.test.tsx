/**
 * Component tests for components/navigation/navigation-item.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { NavigationItemComponent } from '@/components/navigation/navigation-item'
import { Home } from 'lucide-react'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock Submenu component
jest.mock('@/components/submenu', () => ({
  Submenu: ({ columns, isVisible }: { columns: any; isVisible: boolean }) =>
    isVisible ? <div data-testid="submenu">Submenu</div> : null,
}))

const mockNavigationItem = {
  label: 'Home',
  href: '/home',
  icon: Home,
  active: false,
  hasSubmenu: false,
}

describe('NavigationItemComponent', () => {
  it('should render navigation item with label and icon', () => {
    const onToggleSubmenu = jest.fn()
    const onCloseSubmenu = jest.fn()
    const itemRef = jest.fn()

    render(
      <NavigationItemComponent
        item={mockNavigationItem}
        isExpanded={false}
        itemRef={itemRef}
        onToggleSubmenu={onToggleSubmenu}
        onCloseSubmenu={onCloseSubmenu}
      />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/home')
  })

  it('should show active indicator when item is active', () => {
    const onToggleSubmenu = jest.fn()
    const onCloseSubmenu = jest.fn()
    const itemRef = jest.fn()

    render(
      <NavigationItemComponent
        item={{ ...mockNavigationItem, active: true }}
        isExpanded={false}
        itemRef={itemRef}
        onToggleSubmenu={onToggleSubmenu}
        onCloseSubmenu={onCloseSubmenu}
      />
    )

    const link = screen.getByRole('link', { name: /home/i })
    const activeBar = link.querySelector('span[aria-hidden]')
    expect(activeBar).toBeInTheDocument()
  })

  it('should toggle submenu when button is clicked', async () => {
    const user = userEvent.setup()
    const onToggleSubmenu = jest.fn()
    const onCloseSubmenu = jest.fn()
    const itemRef = jest.fn()

    render(
      <NavigationItemComponent
        item={{ ...mockNavigationItem, hasSubmenu: true, submenuColumns: [] }}
        isExpanded={false}
        itemRef={itemRef}
        onToggleSubmenu={onToggleSubmenu}
        onCloseSubmenu={onCloseSubmenu}
      />
    )

    const toggleButton = screen.getByRole('button', { name: /toggle home submenu/i })
    await user.click(toggleButton)
    expect(onToggleSubmenu).toHaveBeenCalledWith('Home')
  })

  it('should show submenu when expanded', () => {
    const onToggleSubmenu = jest.fn()
    const onCloseSubmenu = jest.fn()
    const itemRef = jest.fn()

    render(
      <NavigationItemComponent
        item={{ ...mockNavigationItem, hasSubmenu: true, submenuColumns: [] }}
        isExpanded={true}
        itemRef={itemRef}
        onToggleSubmenu={onToggleSubmenu}
        onCloseSubmenu={onCloseSubmenu}
      />
    )

    expect(screen.getByTestId('submenu')).toBeInTheDocument()
  })

  it('should call onItemHover when item with submenu is hovered', async () => {
    const user = userEvent.setup()
    const onToggleSubmenu = jest.fn()
    const onCloseSubmenu = jest.fn()
    const onItemHover = jest.fn()
    const itemRef = jest.fn()

    const { container } = render(
      <NavigationItemComponent
        item={{ ...mockNavigationItem, hasSubmenu: true, submenuColumns: [] }}
        isExpanded={false}
        itemRef={itemRef}
        onToggleSubmenu={onToggleSubmenu}
        onCloseSubmenu={onCloseSubmenu}
        onItemHover={onItemHover}
      />
    )

    const listItem = container.querySelector('li')
    if (listItem) {
      await user.hover(listItem)
      expect(onItemHover).toHaveBeenCalledWith('Home')
    }
  })

  it('should not show submenu toggle button when hasSubmenu is false', () => {
    const onToggleSubmenu = jest.fn()
    const onCloseSubmenu = jest.fn()
    const itemRef = jest.fn()

    render(
      <NavigationItemComponent
        item={mockNavigationItem}
        isExpanded={false}
        itemRef={itemRef}
        onToggleSubmenu={onToggleSubmenu}
        onCloseSubmenu={onCloseSubmenu}
      />
    )

    const toggleButton = screen.queryByRole('button', { name: /toggle home submenu/i })
    expect(toggleButton).not.toBeInTheDocument()
  })
})



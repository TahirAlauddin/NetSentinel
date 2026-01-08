/**
 * Component tests for components/submenu.tsx
 * 
 * Tests cover:
 * - Visibility toggle
 * - Single category layout
 * - Multiple categories layout
 * - Link rendering
 * - Close functionality
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { Submenu } from '@/components/submenu'
import { SubmenuColumn } from '@/types/navigation'

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

describe('Submenu', () => {
  const mockColumns: SubmenuColumn[] = [
    {
      title: 'Category 1',
      links: [
        { href: '/link1', label: 'Link 1' },
        { href: '/link2', label: 'Link 2' },
      ],
    },
    {
      title: 'Category 2',
      links: [
        { href: '/link3', label: 'Link 3' },
        { href: '/link4', label: 'Link 4' },
      ],
    },
  ]

  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isVisible is false', () => {
    const { container } = render(
      <Submenu columns={mockColumns} isVisible={false} onClose={mockOnClose} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render when isVisible is true', () => {
    render(
      <Submenu columns={mockColumns} isVisible={true} onClose={mockOnClose} />
    )

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('should render single category layout when only one column', () => {
    const singleColumn: SubmenuColumn[] = [
      {
        title: 'Single Category',
        links: [
          { href: '/link1', label: 'Link 1' },
          { href: '/link2', label: 'Link 2' },
        ],
      },
    ]

    render(
      <Submenu columns={singleColumn} isVisible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Single Category')).toBeInTheDocument()
    expect(screen.getByText('Link 1')).toBeInTheDocument()
    expect(screen.getByText('Link 2')).toBeInTheDocument()
  })

  it('should render multiple categories layout when multiple columns', () => {
    render(
      <Submenu columns={mockColumns} isVisible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Category 1')).toBeInTheDocument()
    expect(screen.getByText('Category 2')).toBeInTheDocument()
    expect(screen.getByText('Link 1')).toBeInTheDocument()
    expect(screen.getByText('Link 2')).toBeInTheDocument()
    expect(screen.getByText('Link 3')).toBeInTheDocument()
    expect(screen.getByText('Link 4')).toBeInTheDocument()
  })

  it('should have correct hrefs for links', () => {
    render(
      <Submenu columns={mockColumns} isVisible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Link 1').closest('a')).toHaveAttribute('href', '/link1')
    expect(screen.getByText('Link 2').closest('a')).toHaveAttribute('href', '/link2')
  })

  it('should call onClose when link is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Submenu columns={mockColumns} isVisible={true} onClose={mockOnClose} />
    )

    const link = screen.getByText('Link 1')
    await user.click(link)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when mouse leaves submenu', async () => {
    const user = userEvent.setup()
    render(
      <Submenu columns={mockColumns} isVisible={true} onClose={mockOnClose} />
    )

    const menu = screen.getByRole('menu')
    await user.hover(menu)
    await user.unhover(menu)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should render without title when title is not provided', () => {
    const columnsWithoutTitle: SubmenuColumn[] = [
      {
        links: [
          { href: '/link1', label: 'Link 1' },
        ],
      },
    ]

    render(
      <Submenu columns={columnsWithoutTitle} isVisible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Link 1')).toBeInTheDocument()
  })

  it('should apply correct top position', () => {
    const { container } = render(
      <Submenu columns={mockColumns} isVisible={true} onClose={mockOnClose} top={100} />
    )

    const menu = container.firstChild as HTMLElement
    expect(menu).toHaveStyle({ top: '100px' })
  })
})


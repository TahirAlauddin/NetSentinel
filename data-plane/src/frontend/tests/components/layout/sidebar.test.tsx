/**
 * Component tests for components/layout/sidebar.tsx
 * 
 * Tests cover:
 * - Sidebar rendering
 * - BrandHeader integration
 * - Navigation component integration
 * - Footer help section
 * - onClose callback handling
 */

// TODO: Uncomment when implementing tests
// import { render, screen } from '@/tests/__utils__/test-utils'

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render sidebar with all components', () => {
    render(<Sidebar />)

    expect(screen.getByTestId('brand-header')).toBeInTheDocument()
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(screen.getByText('LIVE HELP')).toBeInTheDocument()
  })

  it('should render footer help section', () => {
    render(<Sidebar />)

    const footerHelp = screen.getByText('LIVE HELP')
    expect(footerHelp).toBeInTheDocument()
    expect(footerHelp.closest('div')).toHaveClass('text-xs', 'text-white/70')
  })

  it('should pass onClose to BrandHeader when provided', () => {
    const onClose = jest.fn()
    render(<Sidebar onClose={onClose} />)

    const brandHeader = screen.getByTestId('brand-header')
    expect(brandHeader).toBeInTheDocument()
    
    const closeButton = screen.getByTestId('brand-close-button')
    expect(closeButton).toBeInTheDocument()
  })

  it('should not show close button in BrandHeader when onClose is not provided', () => {
    render(<Sidebar />)

    const brandHeader = screen.getByTestId('brand-header')
    expect(brandHeader).toBeInTheDocument()
    
    const closeButton = screen.queryByTestId('brand-close-button')
    expect(closeButton).not.toBeInTheDocument()
  })

  it('should call onClose when BrandHeader close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<Sidebar onClose={onClose} />)

    const closeButton = screen.getByTestId('brand-close-button')
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should render Navigation with navigationItems', () => {
    render(<Sidebar />)

    const navigation = screen.getByTestId('navigation')
    expect(navigation).toBeInTheDocument()
    
    // Verify navigation items are passed (mocked component shows count)
    expect(screen.getByTestId('navigation-items-count')).toHaveTextContent('2 items')
  })

  it('should have correct sidebar styling classes', () => {
    const { container } = render(<Sidebar />)
    const sidebar = container.firstChild as HTMLElement

    expect(sidebar).toHaveClass(
      'top-0',
      'h-screen',
      'bg-[oklch(0.24_0_0)]',
      'text-white',
      'overflow-y-auto',
      'overflow-x-visible',
      'z-30',
      'relative'
    )
  })
})


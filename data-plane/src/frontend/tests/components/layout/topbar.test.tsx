/**
 * Component tests for components/layout/topbar.tsx
 *
 * Tests cover:
 * - Topbar rendering
 * - Menu toggle button (mobile)
 * - Welcome message with user name
 * - Admin badge display
 * - Logout button when authenticated
 * - Login link when not authenticated
 * - Logout functionality
 * - Menu toggle functionality
 */

import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Topbar } from '@/components/layout/topbar'
import { useSession, signOut } from 'next-auth/react'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
}))

describe('Topbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
        },
      },
      status: 'authenticated',
    })
    ;(signOut as jest.Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  it('should render topbar with welcome message', () => {
    render(<Topbar onMenuToggle={jest.fn()} />)

    expect(screen.getByText(/welcome:/i)).toBeInTheDocument()
  })

  it('should display username from session', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
        },
      },
      status: 'authenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('should display "User" when username is not available (even if name exists)', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          username: undefined,
        },
      },
      status: 'authenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    // Component only checks username, not name
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should display "User" as fallback when neither username nor name is available', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          username: undefined,
          name: undefined,
        },
      },
      status: 'authenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should show admin badge when user is staff', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
          isStaff: true,
        },
      },
      status: 'authenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should not show admin badge when user is not staff', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
          isStaff: false,
        },
      },
      status: 'authenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('should render menu toggle button for mobile', () => {
    render(<Topbar onMenuToggle={jest.fn()} />)

    const menuButton = screen.getByLabelText(/toggle menu/i)
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).toHaveClass('lg:hidden')
  })

  it('should call onMenuToggle when menu button is clicked', async () => {
    const user = userEvent.setup()
    const onMenuToggle = jest.fn()
    render(<Topbar onMenuToggle={onMenuToggle} />)

    const menuButton = screen.getByLabelText(/toggle menu/i)
    await user.click(menuButton)

    expect(onMenuToggle).toHaveBeenCalledTimes(1)
  })

  it('should show logout button when authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
        },
      },
      status: 'authenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    expect(logoutButton).toBeInTheDocument()
  })

  it('should call signOut when logout button is clicked', async () => {
    const user = userEvent.setup()
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
        },
      },
      status: 'authenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })

  it('should show login link when not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    const loginLink = screen.getByRole('link', { name: /login/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('should not show logout button when not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<Topbar onMenuToggle={jest.fn()} />)

    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument()
  })

  it('should have correct styling classes', () => {
    const { container } = render(<Topbar onMenuToggle={jest.fn()} />)
    const topbar = container.firstChild as HTMLElement

    expect(topbar).toHaveClass(
      'w-full',
      'bg-[oklch(0.24_0_0)]',
      'text-white'
    )
  })
})

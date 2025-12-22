/**
 * Component tests for components/layout/brand-header.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { BrandHeader } from '@/components/layout/brand-header'

// Mock the brandConfig
jest.mock('@/constants/navigation', () => ({
  brandConfig: {
    name: 'NetSentinel',
    subtitle: 'Network Management',
    logo: () => <div data-testid="logo-icon">Logo</div>,
    logoColor: 'bg-primary',
  },
}))

describe('BrandHeader', () => {
  it('should render brand name and subtitle', () => {
    render(<BrandHeader />)
    
    expect(screen.getByText('NetSentinel')).toBeInTheDocument()
    expect(screen.getByText('Network Management')).toBeInTheDocument()
  })

  it('should render logo icon', () => {
    render(<BrandHeader />)
    expect(screen.getByTestId('logo-icon')).toBeInTheDocument()
  })

  it('should not show close button when onClose is not provided', () => {
    render(<BrandHeader />)
    const closeButton = screen.queryByLabelText(/close menu/i)
    expect(closeButton).not.toBeInTheDocument()
  })

  it('should show close button when onClose is provided', () => {
    const onClose = jest.fn()
    render(<BrandHeader onClose={onClose} />)
    
    const closeButton = screen.getByLabelText(/close menu/i)
    expect(closeButton).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<BrandHeader onClose={onClose} />)
    
    const closeButton = screen.getByLabelText(/close menu/i)
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})



/**
 * Component tests for components/ui/button.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply variant classes', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    const button = container.querySelector('button')
    // Button uses CVA which applies multiple classes, check for key class
    expect(button?.className).toContain('bg-destructive')
  })

  it('should apply size classes', () => {
    const { container } = render(<Button size="lg">Large button</Button>)
    const button = container.querySelector('button')
    // Button uses CVA which applies multiple classes, check for key class
    expect(button?.className).toContain('h-10')
  })
})


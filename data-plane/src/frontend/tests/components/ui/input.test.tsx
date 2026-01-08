/**
 * Component tests for components/ui/input.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('should render input element', () => {
    render(<Input data-testid="test-input" />)
    expect(screen.getByTestId('test-input')).toBeInTheDocument()
  })

  it('should render with placeholder text', () => {
    render(<Input placeholder="Enter your name" />)
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
  })

  it('should handle text input', async () => {
    const user = userEvent.setup()
    render(<Input data-testid="test-input" />)
    const input = screen.getByTestId('test-input') as HTMLInputElement
    
    await user.type(input, 'Hello World')
    expect(input.value).toBe('Hello World')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="test-input" />)
    expect(screen.getByTestId('test-input')).toBeDisabled()
  })

  it('should apply custom className', () => {
    const { container } = render(<Input className="custom-class" data-testid="test-input" />)
    const input = container.querySelector('input')
    expect(input?.className).toContain('custom-class')
  })

  it('should support different input types', () => {
    render(<Input type="email" data-testid="test-input" />)
    const input = screen.getByTestId('test-input') as HTMLInputElement
    expect(input.type).toBe('email')
  })

  it('should handle value prop', () => {
    render(<Input value="test value" readOnly data-testid="test-input" />)
    const input = screen.getByTestId('test-input') as HTMLInputElement
    expect(input.value).toBe('test value')
  })

  it('should call onChange handler', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Input onChange={handleChange} data-testid="test-input" />)
    
    await user.type(screen.getByTestId('test-input'), 'a')
    expect(handleChange).toHaveBeenCalled()
  })
})


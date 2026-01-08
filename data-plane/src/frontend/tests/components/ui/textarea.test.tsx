/**
 * Component tests for components/ui/textarea.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('should render textarea element', () => {
    render(<Textarea data-testid="test-textarea" />)
    expect(screen.getByTestId('test-textarea')).toBeInTheDocument()
  })

  it('should render with placeholder text', () => {
    render(<Textarea placeholder="Enter your message" />)
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument()
  })

  it('should handle text input', async () => {
    const user = userEvent.setup()
    render(<Textarea data-testid="test-textarea" />)
    const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement
    
    await user.type(textarea, 'This is a test message')
    expect(textarea.value).toBe('This is a test message')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled data-testid="test-textarea" />)
    expect(screen.getByTestId('test-textarea')).toBeDisabled()
  })

  it('should apply custom className', () => {
    const { container } = render(<Textarea className="custom-class" data-testid="test-textarea" />)
    const textarea = container.querySelector('textarea')
    expect(textarea?.className).toContain('custom-class')
  })

  it('should handle value prop', () => {
    render(<Textarea value="test value" readOnly data-testid="test-textarea" />)
    const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement
    expect(textarea.value).toBe('test value')
  })

  it('should call onChange handler', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Textarea onChange={handleChange} data-testid="test-textarea" />)
    
    await user.type(screen.getByTestId('test-textarea'), 'a')
    expect(handleChange).toHaveBeenCalled()
  })

  it('should support rows attribute', () => {
    render(<Textarea rows={5} data-testid="test-textarea" />)
    const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement
    expect(textarea.rows).toBe(5)
  })
})



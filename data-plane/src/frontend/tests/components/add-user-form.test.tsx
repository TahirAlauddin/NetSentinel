/**
 * Component tests for components/add-user-form.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import AddUserForm from '@/components/add-user-form'

describe('AddUserForm', () => {
  it('should render all form fields', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={false} />)
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('should render submit button', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={false} />)
    
    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
  })

  it('should show "Adding User..." when submitting', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={true} />)
    
    expect(screen.getByRole('button', { name: /adding user.../i })).toBeInTheDocument()
  })

  it('should disable submit button when submitting', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={true} />)
    
    const submitButton = screen.getByRole('button', { name: /adding user.../i })
    expect(submitButton).toBeDisabled()
  })

  it('should call handleAddUser on form submission', async () => {
    const user = userEvent.setup()
    const handleAddUser = jest.fn((e) => e.preventDefault())
    
    render(<AddUserForm handleAddUser={handleAddUser} submitting={false} />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    await user.type(usernameInput, 'johndoe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    
    const submitButton = screen.getByRole('button', { name: /add user/i })
    await user.click(submitButton)
    
    expect(handleAddUser).toHaveBeenCalled()
  })

  it('should have required fields', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={false} />)
    
    expect(screen.getByLabelText(/username/i)).toBeRequired()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByLabelText(/^password$/i)).toBeRequired()
    expect(screen.getByLabelText(/confirm password/i)).toBeRequired()
  })

  it('should have correct input types', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={false} />)
    
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement
    
    expect(emailInput.type).toBe('email')
    expect(passwordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')
  })

  it('should display placeholder text', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={false} />)
    
    expect(screen.getByPlaceholderText('janedoe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument()
  })

  it('should display note about user permissions', () => {
    const handleAddUser = jest.fn()
    render(<AddUserForm handleAddUser={handleAddUser} submitting={false} />)
    
    expect(screen.getByText(/users will be created in the database with regular user permissions/i)).toBeInTheDocument()
  })
})



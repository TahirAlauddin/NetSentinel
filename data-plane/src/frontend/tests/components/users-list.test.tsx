/**
 * Component tests for components/users-list.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import UserList from '@/components/users-list'

const mockUsers = [
  {
    id: 1,
    username: 'johndoe',
    email: 'john@example.com',
    is_superuser: true,
    is_staff: true,
  },
  {
    id: 2,
    username: 'janedoe',
    email: 'jane@example.com',
    is_superuser: false,
    is_staff: true,
  },
  {
    id: 3,
    username: 'regularuser',
    email: 'user@example.com',
    is_superuser: false,
    is_staff: false,
  },
]

describe('UserList', () => {
  it('should render users table with headers', () => {
    render(<UserList users={mockUsers} />)
    
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('ID')).toBeInTheDocument()
  })

  it('should render user data', () => {
    render(<UserList users={mockUsers} />)
    
    expect(screen.getByText('johndoe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Superuser')).toBeInTheDocument()
  })

  it('should render all users', () => {
    render(<UserList users={mockUsers} />)
    
    expect(screen.getByText('johndoe')).toBeInTheDocument()
    expect(screen.getByText('janedoe')).toBeInTheDocument()
    expect(screen.getByText('regularuser')).toBeInTheDocument()
  })

  it('should display correct role for superuser', () => {
    render(<UserList users={mockUsers} />)
    const superuserRow = screen.getByText('johndoe').closest('tr')
    expect(superuserRow).toHaveTextContent('Superuser')
  })

  it('should display correct role for staff user', () => {
    render(<UserList users={mockUsers} />)
    const staffRow = screen.getByText('janedoe').closest('tr')
    expect(staffRow).toHaveTextContent('Staff')
  })

  it('should display correct role for regular user', () => {
    render(<UserList users={mockUsers} />)
    const userRow = screen.getByText('regularuser').closest('tr')
    expect(userRow).toHaveTextContent('User')
  })

  it('should display user IDs', () => {
    render(<UserList users={mockUsers} />)
    
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('1')
    expect(table).toHaveTextContent('2')
    expect(table).toHaveTextContent('3')
  })

  it('should show "No users found" when users array is empty', () => {
    render(<UserList users={[]} />)
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('should show "Failed to load users" when users is not an array', () => {
    render(<UserList users={null as any} />)
    expect(screen.getByText('Failed to load users')).toBeInTheDocument()
  })

  it('should render email in desktop view', () => {
    render(<UserList users={mockUsers} />)
    // Email should be in the document but might be hidden on mobile
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('should handle single user', () => {
    const singleUser = [mockUsers[0]]
    render(<UserList users={singleUser} />)
    
    expect(screen.getByText('johndoe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Superuser')).toBeInTheDocument()
  })
})



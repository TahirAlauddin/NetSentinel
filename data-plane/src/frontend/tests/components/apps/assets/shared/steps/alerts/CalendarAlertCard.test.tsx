/**
 * Component tests for components/apps/assets/shared/steps/alerts/CalendarAlertCard.tsx
 * 
 * Tests cover:
 * - Alert card rendering
 * - Date input
 * - User selection
 * - Message input
 * - Remove and confirm actions
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { CalendarAlertCard } from '@/components/apps/assets/shared/steps/alerts/CalendarAlertCard'
import { CalendarAlert } from '@/types/assets/fields'
import { UserRecord } from '@/types/users'

describe('CalendarAlertCard', () => {
  const mockAlert: CalendarAlert = {
    date: '2024-12-31',
    assigned_to: { id: '1', first_name: 'Test', last_name: 'User', email: 'test@example.com', username: 'testuser', is_staff: false, is_active: true, is_superuser: false, date_joined: '2024-01-01', last_login: '2024-01-01' },
    message: 'Test alert message',
  }

  const mockPeople: UserRecord[] = [
    { id: '1', first_name: 'Test', last_name: 'User', email: 'test@example.com', username: 'testuser', is_staff: false, is_active: true, is_superuser: false, date_joined: '2024-01-01', last_login: '2024-01-01' },
    { id: '2', first_name: 'User', last_name: '2', email: 'user2@example.com', username: 'user2', is_staff: false, is_active: true, is_superuser: false, date_joined: '2024-01-01', last_login: '2024-01-01' },
  ]

  const mockOnDateChange = jest.fn()
  const mockOnUserChange = jest.fn()
  const mockOnMessageChange = jest.fn()
  const mockOnRemove = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render alert card with all fields', () => {
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={mockPeople}
        loadingPeople={false}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test alert message')).toBeInTheDocument()
  })

  it('should call onDateChange when date is changed', async () => {
    const user = userEvent.setup()
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={mockPeople}
        loadingPeople={false}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    const dateInput = screen.getByDisplayValue('2024-12-31')
    await user.clear(dateInput)
    await user.type(dateInput, '2025-01-01')

    expect(mockOnDateChange).toHaveBeenCalled()
  })

  it('should call onUserChange when user is selected', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={mockPeople}
        loadingPeople={false}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    // Find the select element - it has value="1" which corresponds to the selected option
    const userSelect = container.querySelector('select') as HTMLSelectElement
    expect(userSelect).toBeInTheDocument()
    expect(userSelect.value).toBe('1') // Current value
    
    await user.selectOptions(userSelect, '2')

    expect(mockOnUserChange).toHaveBeenCalledWith(0, '2')
  })

  it('should call onMessageChange when message is changed', async () => {
    const user = userEvent.setup()
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={mockPeople}
        loadingPeople={false}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    const messageInput = screen.getByDisplayValue('Test alert message')
    await user.clear(messageInput)
    await user.type(messageInput, 'New message')

    expect(mockOnMessageChange).toHaveBeenCalled()
  })

  it('should call onRemove when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={mockPeople}
        loadingPeople={false}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    const removeButtons = screen.getAllByTitle('Remove alert')
    await user.click(removeButtons[0])

    expect(mockOnRemove).toHaveBeenCalledWith(0)
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={mockPeople}
        loadingPeople={false}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButtons = screen.getAllByTitle('Confirm alert')
    await user.click(confirmButtons[0])

    expect(mockOnConfirm).toHaveBeenCalledWith(0)
  })

  it('should show loading state when loading people', () => {
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={[]}
        loadingPeople={true}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })

  it('should show error state when people loading fails', () => {
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={[]}
        loadingPeople={false}
        peopleError="Failed to load"
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText('Error loading users')).toBeInTheDocument()
  })

  it('should show empty state when no people available', () => {
    render(
      <CalendarAlertCard
        alert={mockAlert}
        index={0}
        people={[]}
        loadingPeople={false}
        peopleError={null}
        onDateChange={mockOnDateChange}
        onUserChange={mockOnUserChange}
        onMessageChange={mockOnMessageChange}
        onRemove={mockOnRemove}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText('No users available')).toBeInTheDocument()
  })
})


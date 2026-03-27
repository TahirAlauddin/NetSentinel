/**
 * Component tests for components/groups/group-form.tsx
 * 
 * Tests cover:
 * - Form rendering
 * - Name input
 * - Permission selection
 * - Form submission
 * - Cancel functionality
 * - Permission grouping
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import GroupForm from '@/components/groups/group-form'
import { PermissionRecord } from '@/types/groups'

describe('GroupForm', () => {
  const mockPermissions: PermissionRecord[] = [
    { id: 1, name: 'Can view assets', codename: 'view_asset', content_type: 1 },
    { id: 2, name: 'Can edit assets', codename: 'edit_asset', content_type: 1 },
    { id: 3, name: 'Can delete assets', codename: 'delete_asset', content_type: 1 },
    { id: 4, name: 'Can view users', codename: 'view_user', content_type: 2 },
  ]

  const mockOnSubmit = jest.fn((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  })
  const mockOnCancel = jest.fn()
  const mockSetName = jest.fn()
  const mockSetSelectedPermissions = jest.fn()
  const mockSearchPermissionsPage = jest.fn(async () => ({ results: [], hasMore: false }))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form fields', () => {
    render(
      <GroupForm
        name=""
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument()
    expect(screen.getByText(/permissions/i)).toBeInTheDocument()
  })

  it('should display all permissions', () => {
    render(
      <GroupForm
        name=""
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    expect(screen.getByText('Can view assets')).toBeInTheDocument()
    expect(screen.getByText('Can edit assets')).toBeInTheDocument()
    expect(screen.getByText('Can delete assets')).toBeInTheDocument()
    expect(screen.getByText('Can view users')).toBeInTheDocument()
  })

  it('should update name when input changes', async () => {
    const user = userEvent.setup()
    render(
      <GroupForm
        name=""
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    const nameInput = screen.getByLabelText(/group name/i)
    await user.type(nameInput, 'Test Group')

    expect(mockSetName).toHaveBeenCalled()
  })

  it('should toggle permission selection', async () => {
    const user = userEvent.setup()
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    const permissionCheckbox = screen.getByLabelText('Can view assets')
    await user.click(permissionCheckbox)

    expect(mockSetSelectedPermissions).toHaveBeenCalledWith([1])
  })

  it('should show selected permissions count', () => {
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[1, 2]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    expect(screen.getByText(/2 permissions selected/i)).toBeInTheDocument()
  })

  it('should show singular permission count', () => {
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[1]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    expect(screen.getByText(/1 permission selected/i)).toBeInTheDocument()
  })

  it('should call onSubmit on form submit', async () => {
    const user = userEvent.setup()
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[1]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    const submitButton = screen.getByRole('button', { name: /create group/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should disable submit button when name is empty', () => {
    render(
      <GroupForm
        name=""
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    const submitButton = screen.getByRole('button', { name: /create group/i })
    expect(submitButton).toBeDisabled()
  })

  it('should disable submit button when submitting', () => {
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    const submitButton = screen.getByRole('button', { name: /saving/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show submitting text when submitting', () => {
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={mockPermissions}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('should show empty state when no permissions available', () => {
    render(
      <GroupForm
        name="Test Group"
        setName={mockSetName}
        selectedPermissions={[]}
        setSelectedPermissions={mockSetSelectedPermissions}
        permissions={[]}
        onSearchPermissionsPage={mockSearchPermissionsPage}
        submitting={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        submitLabel="Create Group"
      />
    )

    expect(screen.getByText(/no permissions available/i)).toBeInTheDocument()
  })
})


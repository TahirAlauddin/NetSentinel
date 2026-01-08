/**
 * Component tests for components/groups/groups-list.tsx
 * 
 * Tests cover:
 * - Group list rendering
 * - Empty state
 * - Expand/collapse functionality
 * - Edit and delete actions
 * - Permission display
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import GroupsList from '@/components/groups/groups-list'
import { GroupRecord } from '@/types/groups'

describe('GroupsList', () => {
  const mockGroups: GroupRecord[] = [
    {
      id: 1,
      name: 'Administrators',
      user_count: 5,
      permissions_detail: [
        { id: 1, name: 'Can view assets', codename: 'view_asset', content_type: 1 },
        { id: 2, name: 'Can edit assets', codename: 'edit_asset', content_type: 1 },
      ],
    },
    {
      id: 2,
      name: 'Viewers',
      user_count: 10,
      permissions_detail: [],
    },
  ]

  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all groups', () => {
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    expect(screen.getByText('Administrators')).toBeInTheDocument()
    expect(screen.getByText('Viewers')).toBeInTheDocument()
  })

  it('should display user count', () => {
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    expect(screen.getByText(/5 users/i)).toBeInTheDocument()
    expect(screen.getByText(/10 users/i)).toBeInTheDocument()
  })

  it('should display permissions count', () => {
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    expect(screen.getByText(/2 permissions/i)).toBeInTheDocument()
  })

  it('should show empty state when no groups', () => {
    render(
      <GroupsList
        groups={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    expect(screen.getByText(/no groups found/i)).toBeInTheDocument()
  })

  it('should expand/collapse permissions when expand button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    // Find expand button (ChevronRight icon)
    const expandButtons = screen.getAllByTitle(/expand permissions/i)
    await user.click(expandButtons[0])

    // Should show all permissions
    await waitFor(() => {
      expect(screen.getByText('Can view assets')).toBeInTheDocument()
      expect(screen.getByText('Can edit assets')).toBeInTheDocument()
    })
  })

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    const editButtons = screen.getAllByTitle(/edit/i)
    await user.click(editButtons[0])

    expect(mockOnEdit).toHaveBeenCalledWith(mockGroups[0])
  })

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    const deleteButtons = screen.getAllByTitle(/delete/i)
    await user.click(deleteButtons[0])

    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('should disable edit and delete buttons when editing', () => {
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={1}
      />
    )

    const editButtons = screen.getAllByTitle(/edit/i)
    const deleteButtons = screen.getAllByTitle(/delete/i)

    editButtons.forEach(button => {
      expect(button).toBeDisabled()
    })
    deleteButtons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('should show "No permissions assigned" for groups without permissions', () => {
    render(
      <GroupsList
        groups={mockGroups}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    expect(screen.getByText(/no permissions assigned/i)).toBeInTheDocument()
  })

  it('should show preview of first 3 permissions when collapsed', () => {
    const groupsWithManyPermissions: GroupRecord[] = [
      {
        id: 1,
        name: 'Test Group',
        user_count: 0,
        permissions_detail: [
          { id: 1, name: 'Permission 1', codename: 'perm1', content_type: 1 },
          { id: 2, name: 'Permission 2', codename: 'perm2', content_type: 1 },
          { id: 3, name: 'Permission 3', codename: 'perm3', content_type: 1 },
          { id: 4, name: 'Permission 4', codename: 'perm4', content_type: 1 },
        ],
      },
    ]

    render(
      <GroupsList
        groups={groupsWithManyPermissions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        editingId={null}
      />
    )

    expect(screen.getByText('Permission 1')).toBeInTheDocument()
    expect(screen.getByText('Permission 2')).toBeInTheDocument()
    expect(screen.getByText('Permission 3')).toBeInTheDocument()
    expect(screen.getByText(/\+1 more/i)).toBeInTheDocument()
  })
})


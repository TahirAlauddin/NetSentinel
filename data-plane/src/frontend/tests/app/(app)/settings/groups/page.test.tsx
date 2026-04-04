/**
 * Component tests for app/(app)/settings/groups/page.tsx
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import { useSession } from 'next-auth/react'
import GroupsPage from '@/app/(app)/settings/groups/page'
import * as settingsActions from '@/app/(app)/settings/actions'

jest.mock('@/app/(app)/settings/actions', () => ({
  listGroups: jest.fn().mockResolvedValue([]),
  deleteGroup: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
  getGroup: jest.fn().mockResolvedValue({ permissions_detail: [] }),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}))

jest.mock('@/components/feedback/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/settings/settings-header', () => ({
  SettingsHeader: () => <div data-testid="settings-header">Header</div>,
}))

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        permissions: [],
        isSuperuser: false,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    },
    status: 'authenticated',
    update: jest.fn(),
  } as ReturnType<typeof useSession>)
})

describe('GroupsPage', () => {
  it('should render page components', async () => {
    render(<GroupsPage />)

    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add group/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /current groups/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(jest.mocked(settingsActions.listGroups)).toHaveBeenCalled()
    })
  })

  it('should show empty state when no groups', async () => {
    render(<GroupsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no groups found/i)).toBeInTheDocument()
    })
  })
})

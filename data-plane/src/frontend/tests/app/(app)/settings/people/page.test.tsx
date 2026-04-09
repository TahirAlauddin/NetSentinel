/**
 * Component tests for app/(app)/settings/people/page.tsx
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import { useSession } from 'next-auth/react'
import PeoplePage from '@/app/(app)/settings/people/page'
import * as settingsActions from '@/app/(app)/settings/actions'

jest.mock('@/app/(app)/settings/actions', () => ({
  listUsers: jest.fn().mockResolvedValue([]),
  deleteUser: jest.fn().mockResolvedValue({ success: true, message: 'User deleted' }),
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
        isSuperuser: true,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    },
    status: 'authenticated',
    update: jest.fn(),
  } as ReturnType<typeof useSession>)
})

describe('PeoplePage', () => {
  it('should render page components', async () => {
    render(<PeoplePage />)

    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /users/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(jest.mocked(settingsActions.listUsers)).toHaveBeenCalled()
    })
  })

  it('should show empty state when no users', async () => {
    render(<PeoplePage />)

    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument()
    })
  })
})

/**
 * Component tests for app/(app)/settings/departments/page.tsx
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import DepartmentsPage from '@/app/(app)/settings/departments/page'

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

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual<typeof import('@/lib/utils')>('@/lib/utils')
  return {
    ...actual,
    api: {
      get: jest.fn().mockResolvedValue({ data: { results: [] }, error: undefined }),
      post: jest.fn().mockResolvedValue({ data: {}, error: undefined }),
      put: jest.fn().mockResolvedValue({ data: {}, error: undefined }),
      delete: jest.fn().mockResolvedValue({ error: undefined }),
      patch: jest.fn(),
      request: jest.fn(),
    },
  }
})

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

describe('DepartmentsPage', () => {
  it('should render page components', () => {
    render(<DepartmentsPage />)

    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add department/i })).toBeInTheDocument()
  })

  it('should toggle add department form', async () => {
    const user = userEvent.setup()
    render(<DepartmentsPage />)

    const addButton = screen.getByRole('button', { name: /add department/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/add new department/i)).toBeInTheDocument()
    })
  })

  it('should show empty state when no departments', () => {
    render(<DepartmentsPage />)

    expect(screen.getByText(/no departments found/i)).toBeInTheDocument()
  })
})

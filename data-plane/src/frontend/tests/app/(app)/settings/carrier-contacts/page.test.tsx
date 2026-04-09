/**
 * Component tests for app/(app)/settings/carrier-contacts/page.tsx
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import CarrierContactsPage from '@/app/(app)/settings/carrier-contacts/page'

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

jest.mock('@/lib/api-client/infrastructure', () => ({
  InfrastructureApiClient: jest.fn().mockImplementation(() => ({
    getLocations: jest.fn().mockResolvedValue({
      data: { results: [] },
      status: 200,
    }),
    getCarrierContacts: jest.fn().mockResolvedValue({
      data: { results: [] },
      status: 200,
    }),
    createCarrierContact: jest.fn().mockResolvedValue({
      data: { id: 1 },
      status: 201,
    }),
    deleteCarrierContact: jest.fn().mockResolvedValue({ status: 204 }),
    updateCarrierContact: jest.fn().mockResolvedValue({
      data: { id: 1 },
      status: 200,
    }),
  })),
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

jest.mock('@/components/settings/carrier-contact-add-form', () => ({
  CarrierContactAddForm: () => (
    <div data-testid="carrier-contact-add-form">Carrier Contact Add Form</div>
  ),
}))

jest.mock('@/components/settings/carrier-contact-item', () => ({
  CarrierContactItem: () => <div data-testid="carrier-contact-item">Carrier Contact Item</div>,
}))

describe('CarrierContactsPage', () => {
  it('should render page components', () => {
    render(<CarrierContactsPage />)

    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add carrier contact/i })).toBeInTheDocument()
  })

  it('should toggle add carrier contact form', async () => {
    const user = userEvent.setup()
    render(<CarrierContactsPage />)

    const addButton = screen.getByRole('button', { name: /add carrier contact/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByTestId('carrier-contact-add-form')).toBeInTheDocument()
    })
  })

  it('should show empty state when no carrier contacts', () => {
    render(<CarrierContactsPage />)

    expect(screen.getByText(/no carrier contacts found/i)).toBeInTheDocument()
  })
})

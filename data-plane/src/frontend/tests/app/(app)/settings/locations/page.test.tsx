/**
 * Component tests for app/(app)/settings/locations/page.tsx
 * 
 * Tests cover:
 * - Page rendering
 * - Form toggle
 * - Location list display
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationsPage from '@/app/(app)/settings/locations/page'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 1 } },
    status: 'authenticated',
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/lib/api-client/infrastructure', () => ({
  InfrastructureApiClient: jest.fn().mockImplementation(() => ({
    getLocations: jest.fn().mockResolvedValue({
      data: { results: [] },
    }),
    createLocation: jest.fn().mockResolvedValue({
      data: { id: 1 },
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

jest.mock('@/components/settings/settings-nav-tabs', () => ({
  SettingsNavTabs: () => <div data-testid="settings-nav-tabs">Nav Tabs</div>,
}))

jest.mock('@/components/settings/settings-header', () => ({
  SettingsHeader: () => <div data-testid="settings-header">Header</div>,
}))

jest.mock('@/components/locations/add-location-form', () => ({
  __esModule: true,
  default: () => <div data-testid="add-location-form">Add Location Form</div>,
}))

jest.mock('@/components/locations/location-map', () => ({
  __esModule: true,
  default: () => <div data-testid="location-map">Location Map</div>,
}))

describe('LocationsPage', () => {
  it('should render page components', () => {
    render(<LocationsPage />)

    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add location/i })).toBeInTheDocument()
  })

  it('should toggle add location form', async () => {
    const user = userEvent.setup()
    render(<LocationsPage />)

    const addButton = screen.getByRole('button', { name: /add location/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/add new location/i)).toBeInTheDocument()
    })
  })

  it('should show empty state when no locations', () => {
    render(<LocationsPage />)

    expect(screen.getByText(/no locations found/i)).toBeInTheDocument()
  })
})


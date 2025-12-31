/**
 * Component tests for components/apps/assets/shared/steps/AlertsStep.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - Empty alerts state
 * - Alert cards rendering
 * - Add alert functionality
 */

import { render, screen, waitFor } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { AlertsStep } from '@/components/apps/assets/shared/steps/AlertsStep'

// Mock hooks
jest.mock('@/components/apps/assets/hooks/useFormDataFetch', () => ({
  useAlertsStep: jest.fn(),
  useFormPeopleFetch: jest.fn(),
}))

jest.mock('@/components/apps/assets/hooks/useCalendarAlerts', () => ({
  useCalendarAlerts: jest.fn(),
}))

// Mock alert components
jest.mock('@/components/apps/assets/shared/steps/alerts/CalendarAlertCard', () => ({
  CalendarAlertCard: ({ alert, index }: any) => (
    <div data-testid={`alert-card-${index}`}>
      <span>{alert.message || 'No message'}</span>
    </div>
  ),
}))

jest.mock('@/components/apps/assets/shared/steps/alerts/EmptyAlertsState', () => ({
  EmptyAlertsState: ({ onAddAlert }: any) => (
    <div data-testid="empty-alerts-state">
      <button onClick={onAddAlert} data-testid="add-alert-button">
        Add Alert
      </button>
    </div>
  ),
}))

jest.mock('@/components/apps/assets/shared/steps/alerts/AddAlertButton', () => ({
  AddAlertButton: ({ onAddAlert }: any) => (
    <button onClick={onAddAlert} data-testid="add-alert-button-existing">
      Add Alert
    </button>
  ),
}))

describe('AlertsStep', () => {
  const mockOnInputChange = jest.fn()
  const mockAddAlert = jest.fn()
  const mockRemoveAlert = jest.fn()
  const mockUpdateAlertDate = jest.fn()
  const mockUpdateAlertMessage = jest.fn()
  const mockUpdateAlertUser = jest.fn()
  const mockConfirmAlert = jest.fn()

  const mockUseAlertsStep = require('@/components/apps/assets/hooks/useFormDataFetch').useAlertsStep
  const mockUseFormPeopleFetch = require('@/components/apps/assets/hooks/useFormDataFetch').useFormPeopleFetch
  const mockUseCalendarAlerts = require('@/components/apps/assets/hooks/useCalendarAlerts').useCalendarAlerts

  const mockPeople = [
    { id: '1', first_name: 'Test', last_name: 'User', email: 'test@example.com', username: 'testuser', is_staff: false, is_active: true, is_superuser: false, date_joined: '2024-01-01', last_login: '2024-01-01' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAlertsStep.mockReturnValue({
      formData: {
        calendar_alerts: [],
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })

    mockUseFormPeopleFetch.mockReturnValue({
      people: mockPeople,
      loading: false,
      error: null,
    })

    mockUseCalendarAlerts.mockReturnValue({
      addAlert: mockAddAlert,
      removeAlert: mockRemoveAlert,
      updateAlertDate: mockUpdateAlertDate,
      updateAlertMessage: mockUpdateAlertMessage,
      updateAlertUser: mockUpdateAlertUser,
      confirmAlert: mockConfirmAlert,
    })
  })

  it('should render component with title', () => {
    render(<AlertsStep />)

    expect(screen.getByText('Alerts')).toBeInTheDocument()
  })

  it('should render empty alerts state when no alerts', () => {
    render(<AlertsStep />)

    expect(screen.getByTestId('empty-alerts-state')).toBeInTheDocument()
    expect(screen.getByText('Calendar Alerts')).toBeInTheDocument()
  })

  it('should render alert cards when alerts exist', () => {
    const alerts = [
      { id: 1, date: '2024-12-31', message: 'Test alert 1' },
      { id: 2, date: '2025-01-01', message: 'Test alert 2' },
    ]

    mockUseAlertsStep.mockReturnValue({
      formData: {
        calendar_alerts: alerts,
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AlertsStep />)

    expect(screen.getByTestId('alert-card-0')).toBeInTheDocument()
    expect(screen.getByTestId('alert-card-1')).toBeInTheDocument()
    expect(screen.getByText('Test alert 1')).toBeInTheDocument()
    expect(screen.getByText('Test alert 2')).toBeInTheDocument()
  })

  it('should render add alert button when alerts exist', () => {
    const alerts = [{ id: 1, date: '2024-12-31', message: 'Test alert' }]

    mockUseAlertsStep.mockReturnValue({
      formData: {
        calendar_alerts: alerts,
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AlertsStep />)

    expect(screen.getByTestId('add-alert-button-existing')).toBeInTheDocument()
  })

  it('should handle loading people state', () => {
    mockUseFormPeopleFetch.mockReturnValue({
      people: [],
      loading: true,
      error: null,
    })

    render(<AlertsStep />)

    expect(screen.getByText('Alerts')).toBeInTheDocument()
  })

  it('should handle error loading people', () => {
    mockUseFormPeopleFetch.mockReturnValue({
      people: [],
      loading: false,
      error: 'Failed to load people',
    })

    render(<AlertsStep />)

    expect(screen.getByText('Alerts')).toBeInTheDocument()
  })

  it('should handle non-array calendar_alerts', () => {
    mockUseAlertsStep.mockReturnValue({
      formData: {
        calendar_alerts: null,
        asset_id: null,
      },
      onInputChange: mockOnInputChange,
    })

    render(<AlertsStep />)

    expect(screen.getByTestId('empty-alerts-state')).toBeInTheDocument()
  })

  it('should call addAlert when add button is clicked', async () => {
    const user = userEvent.setup()
    render(<AlertsStep />)

    const addButton = screen.getByTestId('add-alert-button')
    await user.click(addButton)

    expect(mockAddAlert).toHaveBeenCalled()
  })
})


/**
 * Component tests for components/apps/assets/shared/steps/LocationAndUsageStep.tsx
 * 
 * Tests cover:
 * - Component rendering
 * - Date inputs
 * - People selection
 * - Location selection
 * - Department selection
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { LocationAndUsageStep } from '@/components/apps/assets/shared/steps/LocationAndUsageStep'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// Mock hooks
jest.mock('@/components/apps/assets/hooks/useFormDataFetch', () => ({
  useLocationAndUsageStep: jest.fn(),
  useFormPeopleFetch: jest.fn(),
  useFormLocationsFetch: jest.fn(),
  useFormDepartmentsFetch: jest.fn(),
}))

describe('LocationAndUsageStep', () => {
  const mockOnInputChange = jest.fn()
  const mockUseLocationAndUsageStep = require('@/components/apps/assets/hooks/useFormDataFetch').useLocationAndUsageStep
  const mockUseFormPeopleFetch = require('@/components/apps/assets/hooks/useFormDataFetch').useFormPeopleFetch
  const mockUseFormLocationsFetch = require('@/components/apps/assets/hooks/useFormDataFetch').useFormLocationsFetch
  const mockUseFormDepartmentsFetch = require('@/components/apps/assets/hooks/useFormDataFetch').useFormDepartmentsFetch

  const mockPeople = [
    { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
    { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
  ]

  const mockLocations = [
    { id: 1, city: 'New York', address1: '123 Main St' },
    { id: 2, city: 'Los Angeles', address1: '456 Oak Ave' },
  ]

  const mockDepartments = [
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseLocationAndUsageStep.mockReturnValue({
      formData: {
        in_current_state_since: '',
        expected_checkin_date: '',
        used_by: null,
        managed_by: null,
        location: null,
        departments: [],
      },
      onInputChange: mockOnInputChange,
    })

    mockUseFormPeopleFetch.mockReturnValue({
      people: mockPeople,
      loading: false,
      error: null,
    })

    mockUseFormLocationsFetch.mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    })

    mockUseFormDepartmentsFetch.mockReturnValue({
      departments: mockDepartments,
      loading: false,
      error: null,
    })
  })

  it('should render component with title', () => {
    render(<LocationAndUsageStep />)

    expect(screen.getByText('Location & Usage')).toBeInTheDocument()
  })

  it('should render date inputs', () => {
    render(<LocationAndUsageStep />)

    // getByLabelText might find multiple matches, so use getAllByLabelText
    expect(screen.getAllByLabelText(/in current state since/i).length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText(/expected check-in date/i).length).toBeGreaterThan(0)
  })

  it('should render people selects', () => {
    render(<LocationAndUsageStep />)

    // getByLabelText might find multiple matches, so use getAllByLabelText
    expect(screen.getAllByLabelText(/used by/i).length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText(/managed by/i).length).toBeGreaterThan(0)
  })

  it('should render location select', () => {
    render(<LocationAndUsageStep />)

    // getByLabelText might find multiple matches, so use getAllByLabelText
    expect(screen.getAllByLabelText(/location/i).length).toBeGreaterThan(0)
  })

  it('should render departments select', () => {
    render(<LocationAndUsageStep />)

    // getByLabelText might find multiple matches, so use getAllByLabelText
    expect(screen.getAllByLabelText(/departments/i).length).toBeGreaterThan(0)
  })

  it('should handle date input change', async () => {
    const user = userEvent.setup()
    render(<LocationAndUsageStep />)

    // getByLabelText might find multiple matches, so use getAllByLabelText and take the first
    const dateInputs = screen.getAllByLabelText(/in current state since/i)
    expect(dateInputs.length).toBeGreaterThan(0)
    await user.type(dateInputs[0], '2024-01-01')

    expect(mockOnInputChange).toHaveBeenCalledWith('in_current_state_since', '2024-01-01')
  })

  it('should handle used_by selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<LocationAndUsageStep />)

    // Find the first single select (Used by is the first)
    const selects = container.querySelectorAll('select:not([multiple])')
    const usedBySelect = selects[0] as HTMLSelectElement
    await user.selectOptions(usedBySelect, '1')

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should handle location selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<LocationAndUsageStep />)

    // Find the location select - it's the third single select (after Used by and Managed by)
    const selects = container.querySelectorAll('select:not([multiple])')
    const locationSelect = selects[2] as HTMLSelectElement
    await user.selectOptions(locationSelect, '1')

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should handle department selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<LocationAndUsageStep />)

    // Find the departments select - it's the multiple select
    const deptSelect = container.querySelector('select[multiple]') as HTMLSelectElement
    expect(deptSelect).toBeTruthy()
    await user.selectOptions(deptSelect, '1')

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should handle clearing used_by', async () => {
    const user = userEvent.setup()
    mockUseLocationAndUsageStep.mockReturnValue({
      formData: {
        in_current_state_since: '',
        expected_checkin_date: '',
        used_by: mockPeople[0],
        managed_by: null,
        location: null,
        departments: [],
      },
      onInputChange: mockOnInputChange,
    })

    const { container } = render(<LocationAndUsageStep />)

    // Find the select element for "Used by" - it's the first single select (not multiple)
    // The order is: Used by, Managed by, Location, Departments (multiple)
    const selects = container.querySelectorAll('select:not([multiple])')
    const usedBySelect = selects[0] as HTMLSelectElement
    
    expect(usedBySelect).toBeTruthy()
    expect(usedBySelect.value).toBe('1') // mockPeople[0].id is 1
    await user.selectOptions(usedBySelect, '')

    expect(mockOnInputChange).toHaveBeenCalledWith('used_by', null)
  })

  it('should display selected departments as chips', () => {
    mockUseLocationAndUsageStep.mockReturnValue({
      formData: {
        in_current_state_since: '',
        expected_checkin_date: '',
        used_by: null,
        managed_by: null,
        location: null,
        departments: [mockDepartments[0]],
      },
      onInputChange: mockOnInputChange,
    })

    render(<LocationAndUsageStep />)

    // IT appears both in the select dropdown and as a chip
    // Verify it appears as a chip by checking for the remove button's parent
    const removeButton = screen.getByText('×')
    const chipContainer = removeButton.closest('span')
    expect(chipContainer).toHaveTextContent('IT')
  })

  it('should handle removing department chip', async () => {
    const user = userEvent.setup()
    mockUseLocationAndUsageStep.mockReturnValue({
      formData: {
        in_current_state_since: '',
        expected_checkin_date: '',
        used_by: null,
        managed_by: null,
        location: null,
        departments: [mockDepartments[0]],
      },
      onInputChange: mockOnInputChange,
    })

    render(<LocationAndUsageStep />)

    const removeButton = screen.getByText('×')
    await user.click(removeButton)

    expect(mockOnInputChange).toHaveBeenCalled()
  })

  it('should show loading states', () => {
    mockUseFormPeopleFetch.mockReturnValue({
      people: [],
      loading: true,
      error: null,
    })

    render(<LocationAndUsageStep />)

    // Multiple loading states can appear (Used by, Managed by, Location, Departments)
    const loadingTexts = screen.getAllByText('Loading...')
    expect(loadingTexts.length).toBeGreaterThan(0)
  })

  it('should navigate to locations settings', async () => {
    const user = userEvent.setup()
    const mockPush = jest.fn()
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
    })

    render(<LocationAndUsageStep />)

    const createButton = screen.getByText('+ Create One')
    await user.click(createButton)

    expect(mockPush).toHaveBeenCalledWith('/settings/locations')
  })

  it('should navigate to departments settings', async () => {
    const user = userEvent.setup()
    const mockPush = jest.fn()
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
    })

    render(<LocationAndUsageStep />)

    const linkButton = screen.getByText('here')
    await user.click(linkButton)

    expect(mockPush).toHaveBeenCalledWith('/settings/departments')
  })
})


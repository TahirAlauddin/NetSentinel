/**
 * Component tests for components/apps/assets/shared/steps/alerts/EmptyAlertsState.tsx
 * 
 * Tests cover:
 * - Empty state rendering
 * - Add alert button functionality
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { EmptyAlertsState } from '@/components/apps/assets/shared/steps/alerts/EmptyAlertsState'

describe('EmptyAlertsState', () => {
  const mockOnAddAlert = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render add alert button', () => {
    render(<EmptyAlertsState onAddAlert={mockOnAddAlert} />)

    expect(screen.getByText('Add Alert')).toBeInTheDocument()
  })

  it('should call onAddAlert when icon button is clicked', async () => {
    const user = userEvent.setup()
    render(<EmptyAlertsState onAddAlert={mockOnAddAlert} />)

    const iconButton = screen.getByLabelText('Add alert')
    await user.click(iconButton)

    expect(mockOnAddAlert).toHaveBeenCalledTimes(1)
  })

  it('should call onAddAlert when text button is clicked', async () => {
    const user = userEvent.setup()
    render(<EmptyAlertsState onAddAlert={mockOnAddAlert} />)

    const textButton = screen.getByText('Add Alert')
    await user.click(textButton)

    expect(mockOnAddAlert).toHaveBeenCalledTimes(1)
  })

  it('should have correct aria-label on icon button', () => {
    render(<EmptyAlertsState onAddAlert={mockOnAddAlert} />)

    const iconButton = screen.getByLabelText('Add alert')
    expect(iconButton).toBeInTheDocument()
  })
})


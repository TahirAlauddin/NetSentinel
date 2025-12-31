/**
 * Component tests for components/apps/assets/shared/steps/alerts/AddAlertButton.tsx
 * 
 * Tests cover:
 * - Button rendering
 * - Click handler
 * - Accessibility
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import userEvent from '@testing-library/user-event'
import { AddAlertButton } from '@/components/apps/assets/shared/steps/alerts/AddAlertButton'

describe('AddAlertButton', () => {
  const mockOnAddAlert = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render add alert button', () => {
    render(<AddAlertButton onAddAlert={mockOnAddAlert} />)

    expect(screen.getByText('Add Alert')).toBeInTheDocument()
  })

  it('should call onAddAlert when icon button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddAlertButton onAddAlert={mockOnAddAlert} />)

    const iconButton = screen.getByLabelText('Add alert')
    await user.click(iconButton)

    expect(mockOnAddAlert).toHaveBeenCalledTimes(1)
  })

  it('should call onAddAlert when text button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddAlertButton onAddAlert={mockOnAddAlert} />)

    const textButton = screen.getByText('Add Alert')
    await user.click(textButton)

    expect(mockOnAddAlert).toHaveBeenCalledTimes(1)
  })

  it('should have correct aria-label on icon button', () => {
    render(<AddAlertButton onAddAlert={mockOnAddAlert} />)

    const iconButton = screen.getByLabelText('Add alert')
    expect(iconButton).toBeInTheDocument()
  })
})


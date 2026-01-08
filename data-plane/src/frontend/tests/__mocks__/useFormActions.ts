/**
 * Mock implementation for useFormActions hook
 * Used in tests to avoid testing hook implementation details
 */

export const useFormActions = jest.fn(() => ({
  currentStep: 0,
  handleNext: jest.fn(),
  handlePrevious: jest.fn(),
  handleSave: jest.fn(),
  handleStepClick: jest.fn(),
  isSubmitting: false,
  fieldErrors: {},
  clearFieldError: jest.fn(),
}))


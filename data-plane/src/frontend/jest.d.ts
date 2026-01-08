import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(text: string | RegExp): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveClass(...classNames: string[]): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveValue(value: string | number): R
      toBeChecked(): R
      toBeInvalid(): R
      toBeValid(): R
      toBeRequired(): R
      toBeEmptyDOMElement(): R
      toContainElement(element: HTMLElement | null): R
      toHaveAccessibleDescription(description: string | RegExp): R
      toHaveAccessibleName(name: string | RegExp): R
      toHaveFocus(): R
      toHaveFormValues(values: Record<string, unknown>): R
      toHaveStyle(css: string | Record<string, unknown>): R
      toBePartiallyChecked(): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveErrorMessage(message: string | RegExp): R
    }
  }
}


/**
 * Test utilities and helpers
 * Provides reusable functions for testing React components
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { PermissionsProvider } from '@/contexts/permissions-context'
import { mockSession } from '../__mocks__/next-auth'

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: typeof mockSession | null
}

const AllTheProviders = ({ children, session }: { children: React.ReactNode; session?: typeof mockSession | null }) => {
  return (
    <SessionProvider session={session || mockSession}>
      <PermissionsProvider>
        {children}
      </PermissionsProvider>
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { session, ...renderOptions } = options
  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders session={session}>{children}</AllTheProviders>,
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to create mock event
export const createMockEvent = (overrides: Partial<Event> = {}): Event => {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...overrides,
  } as Event
}

// Helper to create mock form event
export const createMockFormEvent = (overrides: Partial<React.FormEvent> = {}): React.FormEvent<HTMLFormElement> => {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    currentTarget: {
      checkValidity: jest.fn(() => true),
      reportValidity: jest.fn(() => true),
    } as unknown as HTMLFormElement,
    ...overrides,
  } as React.FormEvent<HTMLFormElement>
}


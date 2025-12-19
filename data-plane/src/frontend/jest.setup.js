// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router - using shared mocks from __mocks__ folder
jest.mock('next/navigation', () => {
  const { useRouter, usePathname, useSearchParams } = require('./tests/__mocks__/next-navigation')
  return {
    useRouter,
    usePathname,
    useSearchParams,
  }
})

// Mock Next.js image component - using shared mocks from __mocks__ folder
jest.mock('next/image', () => {
  const MockImage = require('./tests/__mocks__/next-image').default
  return {
    __esModule: true,
    default: MockImage,
  }
})

// Mock next-auth - using shared mocks from __mocks__ folder
jest.mock('next-auth/react', () => {
  const { useSession, signIn, signOut, SessionProvider } = require('./tests/__mocks__/next-auth')
  return {
    useSession,
    signIn,
    signOut,
    SessionProvider,
  }
})

// Mock API clients - using shared mocks from __mocks__ folder
jest.mock('@/lib/api-client/infrastructure', () => {
  const { InfrastructureApiClient } = require('./tests/__mocks__/api-clients')
  return { InfrastructureApiClient }
})

jest.mock('@/lib/api-client/asset', () => {
  const { AssetsApiClient } = require('./tests/__mocks__/api-clients')
  return { AssetsApiClient }
})

jest.mock('@/lib/api-client/user', () => {
  const { UserApiClient } = require('./tests/__mocks__/api-clients')
  return { UserApiClient }
})

// Mock form hooks - using shared mocks from __mocks__ folder
jest.mock('@/components/pages/assets/hooks/useFormActions', () => {
  const { useFormActions } = require('./tests/__mocks__/useFormActions')
  return { useFormActions }
})

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Suppress console errors in tests (optional - remove if you want to see them)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// }


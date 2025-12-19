/**
 * Mock for next-auth
 * Provides test implementations for authentication-related functions
 */

import React from 'react'

export const mockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expires: new Date(Date.now() + 3600000).toISOString(),
}

export const mockUseSession = jest.fn(() => ({
  data: mockSession,
  status: 'authenticated' as const,
}))

export const mockSignIn = jest.fn()
export const mockSignOut = jest.fn()

// Module exports for jest.mock() - matches next-auth/react structure
export const useSession = jest.fn(() => ({
  data: null,
  status: 'unauthenticated' as const,
}))

export const signIn = jest.fn()
export const signOut = jest.fn()

export const SessionProvider = ({ children }: { children: React.ReactNode }) => children

// Reset mocks helper
export const resetAuthMocks = () => {
  mockUseSession.mockReturnValue({
    data: mockSession,
    status: 'authenticated' as const,
  })
  mockSignIn.mockClear()
  mockSignOut.mockClear()
  useSession.mockReturnValue({
    data: null,
    status: 'unauthenticated' as const,
  })
  signIn.mockClear()
  signOut.mockClear()
}


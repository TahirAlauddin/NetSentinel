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
    /** Mirrors JWT session used by PermissionsProvider / RBAC guards */
    permissions: [
      "assets.add_asset",
      "assets.change_asset",
      "assets.delete_asset",
    ] as string[],
    isSuperuser: false,
  },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expires: new Date(Date.now() + 3600000).toISOString(),
}

/** Return shape for `useSession` in tests (supports unauthenticated reset). */
export type MockUseSessionReturn =
  | { data: typeof mockSession; status: 'authenticated' }
  | { data: null; status: 'unauthenticated' }

export const mockUseSession = jest.fn((): MockUseSessionReturn => ({
  data: mockSession,
  status: 'authenticated',
}))

export const mockSignIn = jest.fn()
export const mockSignOut = jest.fn()

// Module exports for jest.mock() - matches next-auth/react structure
export const useSession = jest.fn((): MockUseSessionReturn => ({
  data: mockSession,
  status: 'authenticated',
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


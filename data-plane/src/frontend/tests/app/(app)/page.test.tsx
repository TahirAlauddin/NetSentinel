/**
 * Component tests for app/(app)/page.tsx
 * 
 * Tests cover:
 * - Redirect logic based on access token
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Page from '@/app/(app)/page'

// Mock next/headers and next/navigation
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('App Root Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect to dashboard when access token exists', async () => {
    ;(cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((name: string) => {
        if (name === 'access_token') {
          return { value: 'test-token' }
        }
        return undefined
      }),
    })

    await Page()

    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect to login when access token does not exist', async () => {
    ;(cookies as jest.Mock).mockResolvedValue({
      get: jest.fn(() => undefined),
    })

    await Page()

    expect(redirect).toHaveBeenCalledWith('/login')
  })
})


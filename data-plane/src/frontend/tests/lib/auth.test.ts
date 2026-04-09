/**
 * Unit tests for lib/auth.ts
 * Tests auth options shape and cookie config; token refresh is tested via integration.
 */

jest.mock('next-auth', () => ({ __esModule: true, default: jest.fn(() => ({})) }))

import { authOptions } from '@/lib/auth'

describe('Auth Utils', () => {
  it('should export authOptions with expected structure', () => {
    expect(authOptions).toBeDefined()
    expect(authOptions.providers).toBeDefined()
    expect(Array.isArray(authOptions.providers)).toBe(true)
    expect(authOptions.callbacks).toBeDefined()
    expect(typeof authOptions.callbacks.jwt).toBe('function')
    expect(typeof authOptions.callbacks.session).toBe('function')
    expect(authOptions.session).toBeDefined()
    expect(authOptions.session.strategy).toBe('jwt')
  })

  it('should have at least one provider', () => {
    expect(authOptions.providers.length).toBeGreaterThan(0)
    const creds = authOptions.providers.find(
      (p: { id?: string; name?: string }) => p.id === 'credentials' || p.name === 'credentials'
    )
    expect(creds).toBeDefined()
  })

  it('should have cookies config with session and csrf', () => {
    expect(authOptions.cookies).toBeDefined()
    const cookies = authOptions.cookies
    expect(cookies.sessionToken).toBeDefined()
    expect(cookies.callbackUrl).toBeDefined()
    expect(cookies.csrfToken).toBeDefined()
  })
})


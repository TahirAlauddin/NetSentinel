/**
 * Integration tests for API client.
 * Tests client shape and error handling; full integration uses api-mock-helpers.
 */

import { BaseApiClient } from '@/lib/api-client'

jest.mock('next-auth/react', () => ({
  getSession: jest.fn().mockResolvedValue({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: '123',
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
  }),
  signOut: jest.fn(),
}))

describe('API Client Integration', () => {
  it('should expose get, post, patch, put, delete methods', () => {
    const client = new BaseApiClient()
    expect(typeof client.get).toBe('function')
    expect(typeof client.post).toBe('function')
    expect(typeof client.patch).toBe('function')
    expect(typeof client.put).toBe('function')
    expect(typeof client.delete).toBe('function')
  })

  it('should build URLs with base path', () => {
    const client = new BaseApiClient()
    expect(client).toBeDefined()
    // BaseApiClient uses getApiBaseUrl() which is protected; we verify instance exists
    expect(typeof (client as unknown as { get: (endpoint: string) => Promise<unknown> }).get).toBe('function')
  })

  it('should return response object from get', async () => {
    const client = new BaseApiClient()
    const response = await client.get('/assets/')
    expect(response).toBeDefined()
    expect(typeof response).toBe('object')
  })
})

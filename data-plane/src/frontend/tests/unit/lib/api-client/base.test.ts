/**
 * Unit tests for lib/api-client/base.ts
 * 
 * Note: This tests the abstract BaseApiClientCore class
 * We'll need to create a concrete implementation for testing
 */

import { BaseApiClientCore } from '@/lib/api-client/base'

interface TestSession {
  accessToken?: string
  refreshToken?: string
}

// Concrete implementation for testing
class TestApiClient extends BaseApiClientCore {
  private baseUrl = 'http://localhost:8000/api'
  private session: TestSession | null = null

  protected getApiBaseUrl(): string {
    return this.baseUrl
  }

  protected async getSession(): Promise<TestSession | null> {
    return this.session
  }

  protected async refreshToken(_refreshToken: string): Promise<string | null> {
    return 'new-access-token'
  }

  // Expose protected methods for testing
  public testBuildQueryString(params?: Record<string, unknown>): string {
    return this.buildQueryString(params)
  }

  public testBuildUrl(endpoint: string): string {
    return this.buildUrl(endpoint)
  }

  public testBuildHeaders(customHeaders?: HeadersInit, accessToken?: string): HeadersInit {
    return this.buildHeaders(customHeaders, accessToken)
  }

  public testParseErrorResponse(errorData: unknown, status: number): string {
    return this.parseErrorResponse(errorData, status)
  }
}

describe('BaseApiClientCore', () => {
  let client: TestApiClient

  beforeEach(() => {
    client = new TestApiClient()
  })

  describe('buildQueryString', () => {
    it('should build query string from params', () => {
      const params = { page: 1, limit: 10 }
      const result = client.testBuildQueryString(params)
      expect(result).toBe('?page=1&limit=10')
    })

    it('should filter out undefined and null values', () => {
      const params = { page: 1, limit: undefined, search: null, filter: 'test' }
      const result = client.testBuildQueryString(params)
      expect(result).toBe('?page=1&filter=test')
    })

    it('should return empty string for empty params', () => {
      expect(client.testBuildQueryString({})).toBe('')
      expect(client.testBuildQueryString()).toBe('')
    })
  })

  describe('buildUrl', () => {
    it('should build URL from endpoint', () => {
      expect(client.testBuildUrl('/assets')).toBe('http://localhost:8000/api/assets')
    })

    it('should return full URL if endpoint starts with http', () => {
      expect(client.testBuildUrl('http://example.com/api')).toBe('http://example.com/api')
    })
  })

  describe('buildHeaders', () => {
    it('should include Content-Type header', () => {
      const headers = client.testBuildHeaders()
      expect(headers).toHaveProperty('Content-Type', 'application/json')
    })

    it('should include Authorization header when access token provided', () => {
      const headers = client.testBuildHeaders(undefined, 'test-token')
      expect(headers).toHaveProperty('Authorization', 'Bearer test-token')
    })

    it('should merge custom headers', () => {
      const customHeaders = { 'X-Custom-Header': 'value' }
      const headers = client.testBuildHeaders(customHeaders)
      expect(headers).toHaveProperty('X-Custom-Header', 'value')
    })
  })

  describe('parseErrorResponse', () => {
    it('should parse error response', () => {
      const errorData = { detail: 'Error message' }
      const result = client.testParseErrorResponse(errorData, 400)
      expect(result).toBe('Error message')
    })

    it('should return default message for invalid error data', () => {
      const result = client.testParseErrorResponse(null, 500)
      expect(result).toBe('Request failed with status 500')
    })
  })
})


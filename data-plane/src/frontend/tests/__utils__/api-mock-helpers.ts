/**
 * API mocking helpers
 * Utilities for setting up API mocks in tests
 */

import { mockFetch, createMockResponse, createMockErrorResponse, resetFetchMock } from '../__mocks__/fetch'
import type { BaseApiResponse } from '@/lib/api-client'

// Re-export resetFetchMock for convenience
export { resetFetchMock }

/**
 * Mock a successful API response
 */
export const mockApiSuccess = <T>(data: T, status: number = 200) => {
  mockFetch.mockResolvedValueOnce(
    createMockResponse(data, { ok: true, status })
  )
}

/**
 * Mock an API error response
 */
export const mockApiError = (error: unknown, status: number = 400) => {
  mockFetch.mockResolvedValueOnce(
    createMockErrorResponse(error, status)
  )
}

/**
 * Mock a network error
 */
export const mockNetworkError = (message: string = 'Network error') => {
  mockFetch.mockRejectedValueOnce(new Error(message))
}

/**
 * Mock an unauthorized response
 */
export const mockUnauthorized = () => {
  mockApiError({ detail: 'Authentication credentials were not provided.' }, 401)
}

/**
 * Mock a forbidden response
 */
export const mockForbidden = () => {
  mockApiError({ detail: 'You do not have permission to perform this action.' }, 403)
}

/**
 * Mock a not found response
 */
export const mockNotFound = () => {
  mockApiError({ detail: 'Not found.' }, 404)
}

/**
 * Create a mock BaseApiResponse
 */
export const createMockApiResponse = <T>(
  data?: T,
  error?: string
): BaseApiResponse<T> => {
  if (error) {
    return {
      error,
      status: 400,
    }
  }
  return {
    data: data as T,
    status: 200,
  }
}


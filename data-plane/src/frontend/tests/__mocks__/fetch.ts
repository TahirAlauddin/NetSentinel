/**
 * Mock for fetch API
 * Provides test implementations for HTTP requests
 */

export interface MockFetchResponse {
  ok?: boolean
  status?: number
  statusText?: string
  json?: () => Promise<unknown>
  text?: () => Promise<string>
  headers?: Headers
}

export const createMockResponse = (
  data: unknown,
  options: {
    ok?: boolean
    status?: number
    statusText?: string
  } = {}
): MockFetchResponse => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.statusText ?? 'OK',
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers(),
})

export const createMockErrorResponse = (
  error: unknown,
  status: number = 400
): MockFetchResponse => ({
  ok: false,
  status,
  statusText: 'Bad Request',
  json: async () => error,
  text: async () => JSON.stringify(error),
  headers: new Headers(),
})

// Global fetch mock
export const mockFetch = jest.fn()

// Reset helper
export const resetFetchMock = () => {
  mockFetch.mockClear()
  mockFetch.mockResolvedValue(createMockResponse({}))
}

// Setup default mock
resetFetchMock()


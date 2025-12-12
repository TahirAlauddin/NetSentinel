import { getSession, signOut } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
console.log('API_BASE_URL', API_BASE_URL)

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean
  skipRefresh?: boolean
}

class ApiClient {
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh()

    try {
      const newToken = await this.refreshPromise
      return newToken
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh request
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const session = await getSession()
      
      if (!session?.refreshToken) {
        console.warn('No refresh token available')
        await signOut({ redirect: false })
        return null
      }

      const response = await fetch(`${API_BASE_URL}/auth/jwt/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: session.refreshToken,
        }),
      })

      if (!response.ok) {
        console.warn('Token refresh failed:', response.status)
        await signOut({ redirect: false })
        return null
      }

      const data = await response.json()
      return data.access
    } catch (error) {
      console.error('Token refresh error:', error)
      await signOut({ redirect: false })
      return null
    }
  }

  /**
   * Make an authenticated API request with automatic token refresh
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      requireAuth = true,
      skipRefresh = false,
      ...fetchOptions
    } = options

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

    // If authentication is required, get the session and add auth headers
    if (requireAuth) {
      const session = await getSession()
      
      if (!session?.accessToken) {
        return {
          error: 'No access token available',
          status: 401,
        }
      }

      // Add authorization header
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${session.accessToken}`,
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      // If the request failed due to invalid/expired token, try to refresh
      if (response.status === 401 && requireAuth && !skipRefresh) {
        console.log('Access token expired, attempting refresh...')
        
        const newAccessToken = await this.refreshAccessToken()
        
        if (newAccessToken) {
          // Retry the original request with the new token
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              'Authorization': `Bearer ${newAccessToken}`,
            },
          })

          if (retryResponse.ok) {
            const data = await retryResponse.json()
            return {
              data,
              status: retryResponse.status,
            }
          }
        }

        // If refresh failed or retry failed, return the original error
        return {
          error: 'Authentication failed',
          status: 401,
        }
      }

      if (!response.ok) {
        let errorMessage = 'Request failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          errorMessage = `Request failed with status ${response.status}`
        }

        return {
          error: errorMessage,
          status: response.status,
        }
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return {
          status: response.status,
        }
      }

      const data = await response.json()
      return {
        data,
        status: response.status,
      }
    } catch (error) {
      console.error('API request error:', error)
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      }
    }
  }

  /**
   * Convenience methods for common HTTP methods
   */
  async get<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()

// Export the class for testing purposes
export { ApiClient }

import { getSession, signOut } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface BaseApiResponse<T = any> {
  data?: T
  error?: string
  status: number
  errorData?: any // Raw error data for detailed error handling
}

export interface BaseApiRequestOptions extends RequestInit {
  requireAuth?: boolean
  skipRefresh?: boolean
}

class BaseApiClient {
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  /**
   * Build a query string from params, filtering out undefined and null values
   */
  public buildQueryString(params?: Record<string, any>): string {
    if (!params) return ''
    
    const filteredParams: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        filteredParams[key] = String(value)
      }
    }
    
    const queryString = new URLSearchParams(filteredParams).toString()
    return queryString ? `?${queryString}` : ''
  }

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
    options: BaseApiRequestOptions = {}
  ): Promise<BaseApiResponse<T>> {
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
        let errorData: any = null
        
        try {
          errorData = await response.json()
          
          // Handle Django REST Framework validation errors
          if (errorData && typeof errorData === 'object') {
            // Check for field-level validation errors
            const fieldErrors: string[] = []
            const nonFieldErrors: string[] = []
            
            for (const [key, value] of Object.entries(errorData)) {
              if (key === 'detail' || key === 'message') {
                // Single error message
                errorMessage = String(value)
                break
              } else if (key === 'non_field_errors') {
                // Non-field errors
                if (Array.isArray(value)) {
                  nonFieldErrors.push(...value.map(v => String(v)))
                } else {
                  nonFieldErrors.push(String(value))
                }
              } else if (Array.isArray(value) && value.length > 0) {
                // Field-specific errors
                const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                fieldErrors.push(`${fieldName}: ${value.map(v => String(v)).join(', ')}`)
              }
            }
            
            // Combine all errors
            if (fieldErrors.length > 0 || nonFieldErrors.length > 0) {
              const allErrors = [...nonFieldErrors, ...fieldErrors]
              errorMessage = allErrors.join('; ')
            } else if (errorData.detail) {
              errorMessage = errorData.detail
            } else if (errorData.message) {
              errorMessage = errorData.message
            }
          }
        } catch {
          errorMessage = `Request failed with status ${response.status}`
        }

        return {
          error: errorMessage,
          status: response.status,
          errorData: errorData, // Include raw error data for detailed handling
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
  async get<T = any>(endpoint: string, options?: Omit<BaseApiRequestOptions, 'method'>): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: Omit<BaseApiRequestOptions, 'method' | 'body'>): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: Omit<BaseApiRequestOptions, 'method' | 'body'>): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, data?: any, options?: Omit<BaseApiRequestOptions, 'method' | 'body'>): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: Omit<BaseApiRequestOptions, 'method'>): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

}

// Export a singleton instance
export const apiClient = new BaseApiClient()

// Export the class for testing purposes
export { BaseApiClient }

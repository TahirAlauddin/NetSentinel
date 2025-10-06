import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ServerApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

export interface ServerApiRequestOptions extends RequestInit {
  requireAuth?: boolean
}

class ServerApiClient {
  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/jwt/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      })

      if (!response.ok) {
        console.warn('Token refresh failed:', response.status)
        return null
      }

      const data = await response.json()
      return data.access
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  }

  /**
   * Make an authenticated API request with automatic token refresh
   */
  async request<T = any>(
    endpoint: string,
    options: ServerApiRequestOptions = {}
  ): Promise<ServerApiResponse<T>> {
    const {
      requireAuth = true,
      ...fetchOptions
    } = options

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

    // If authentication is required, get the session and add auth headers
    if (requireAuth) {
      const session = await getServerSession(authOptions)
      
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
      if (response.status === 401 && requireAuth) {
        console.log('Access token expired, attempting refresh...')
        
        const session = await getServerSession(authOptions)
        if (!session?.refreshToken) {
          return {
            error: 'No refresh token available',
            status: 401,
          }
        }
        
        const newAccessToken = await this.refreshAccessToken(session.refreshToken)
        
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
  async get<T = any>(endpoint: string, options?: Omit<ServerApiRequestOptions, 'method'>): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: Omit<ServerApiRequestOptions, 'method' | 'body'>): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: Omit<ServerApiRequestOptions, 'method' | 'body'>): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, data?: any, options?: Omit<ServerApiRequestOptions, 'method' | 'body'>): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: Omit<ServerApiRequestOptions, 'method'>): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Export a singleton instance
export const serverApi = new ServerApiClient()

// Export the class for testing purposes
export { ServerApiClient }

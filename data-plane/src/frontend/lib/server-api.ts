import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { BaseApiClientCore } from "./api-client/base"
import type { ServerApiResponse, ServerApiRequestOptions } from "../types/api-client"

// For server-side requests (runs in container), use Docker service name
// For client-side requests (runs in browser), use NEXT_PUBLIC_API_URL
const API_BASE_URL = process.env.SERVER_API_URL || 'http://backend:8000/api/v1'

/**
 * Server-side API client
 * Handles authentication using getServerSession for server-side requests
 * Note: Does not sign out users on auth failure (server-side has no user session to sign out)
 */
class ServerApiClient extends BaseApiClientCore {
  protected getApiBaseUrl(): string {
    return API_BASE_URL
  }

  protected async getSession(): Promise<{ accessToken?: string; refreshToken?: string } | null> {
    const session = await getServerSession(authOptions)
    if (!session) return null

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    }
  }

  protected async refreshToken(refreshToken: string): Promise<string | null> {
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
  async request<T = unknown>(
    endpoint: string,
    options: ServerApiRequestOptions = {}
  ): Promise<ServerApiResponse<T>> {
    // Convert ServerApiRequestOptions to BaseApiRequestOptions
    const baseOptions = {
      ...options,
      skipRefresh: false, // Server-side always attempts refresh
    }

    const result = await this.executeRequest<T>(endpoint, baseOptions)

    // Convert BaseApiResponse to ServerApiResponse (remove errorData)
    return {
      data: result.data,
      error: result.error,
      status: result.status,
    }
  }

  /**
   * Convenience methods for common HTTP methods
   */
  async get<T = unknown>(
    endpoint: string,
    options?: Omit<ServerApiRequestOptions, 'method'>
  ): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<ServerApiRequestOptions, 'method' | 'body'>
  ): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<ServerApiRequestOptions, 'method' | 'body'>
  ): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<ServerApiRequestOptions, 'method' | 'body'>
  ): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: Omit<ServerApiRequestOptions, 'method'>
  ): Promise<ServerApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Export a singleton instance
export const serverApi = new ServerApiClient()

// Export the class for testing purposes
export { ServerApiClient }

// Re-export types for backward compatibility
export type { ServerApiResponse, ServerApiRequestOptions }

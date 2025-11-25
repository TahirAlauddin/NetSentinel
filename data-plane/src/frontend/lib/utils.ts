import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { apiClient, type BaseApiResponse } from "./api-client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility functions for making authenticated API requests
 * These functions automatically handle token refresh
 */

export const api = {
  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string, options?: { requireAuth?: boolean }): Promise<BaseApiResponse<T>> {
    return apiClient.get<T>(endpoint, options)
  },

  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: { requireAuth?: boolean }): Promise<BaseApiResponse<T>> {
    return apiClient.post<T>(endpoint, data, options)
  },

  /**
   * Make a PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: { requireAuth?: boolean }): Promise<BaseApiResponse<T>> {
    return apiClient.put<T>(endpoint, data, options)
  },

  /**
   * Make a PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options?: { requireAuth?: boolean }): Promise<BaseApiResponse<T>> {
    return apiClient.patch<T>(endpoint, data, options)
  },

  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string, options?: { requireAuth?: boolean }): Promise<BaseApiResponse<T>> {
    return apiClient.delete<T>(endpoint, options)
  },

  /**
   * Make a custom request with full control over options
   */
  async request<T = any>(endpoint: string, options?: any): Promise<BaseApiResponse<T>> {
    return apiClient.request<T>(endpoint, options)
  },
}

/**
 * Helper function to handle API responses and throw errors for failed requests
 */
export function handleApiResponse<T>(response: BaseApiResponse<T>): T {
  if (response.error) {
    throw new Error(response.error)
  }
  return response.data as T
}

/**
 * Helper function to safely handle API responses without throwing
 */
export function safeApiResponse<T>(response: BaseApiResponse<T>): { success: boolean; data?: T; error?: string } {
  if (response.error) {
    return { success: false, error: response.error }
  }
  return { success: true, data: response.data }
}

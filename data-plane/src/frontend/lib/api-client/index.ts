import { getSession, signOut } from "next-auth/react";
import { BaseApiClientCore } from "./base";
import type { BaseApiResponse, BaseApiRequestOptions } from "../../types/api-client";
import type { JWT } from "next-auth/jwt";
import { apiConfig } from "@/lib/config";


/**
 * Client-side API client
 * Handles authentication using next-auth/react for browser-based requests
 */
class BaseApiClient extends BaseApiClientCore {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  protected getApiBaseUrl(): string {
    return apiConfig.clientBaseUrl;
  }

  protected async getSession(): Promise<JWT | null> {
    const session = await getSession();
    if (!session) return null;

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  protected async refreshToken(_refreshToken: string): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh request
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const session = await getSession();

      if (!session?.refreshToken) {
        console.warn("No refresh token available");
        await signOut({ redirect: false });
        return null;
      }

      const response = await fetch(`${this.getApiBaseUrl()}/auth/jwt/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: session.refreshToken,
        }),
      });

      if (!response.ok) {
        console.warn("Token refresh failed:", response.status);
        await signOut({ redirect: false });
        return null;
      }

      const data = await response.json();
      return data.access;
    } catch (error) {
      console.error("Token refresh error:", error);
      await signOut({ redirect: false });
      return null;
    }
  }

  protected async handleAuthFailure(): Promise<void> {
    await signOut({ redirect: false });
  }

  /**
   * Make an authenticated API request with automatic token refresh
   */
  async request<T = unknown>(
    endpoint: string,
    options: BaseApiRequestOptions = {}
  ): Promise<BaseApiResponse<T>> {
    return this.executeRequest<T>(endpoint, options);
  }

  /**
   * Convenience methods for common HTTP methods
   */
  async get<T = unknown>(
    endpoint: string,
    options?: Omit<BaseApiRequestOptions, "method">
  ): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<BaseApiRequestOptions, "method" | "body">
  ): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<BaseApiRequestOptions, "method" | "body">
  ): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<BaseApiRequestOptions, "method" | "body">
  ): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: Omit<BaseApiRequestOptions, "method">
  ): Promise<BaseApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Export a singleton instance
export const apiClient = new BaseApiClient();

// Export the class for testing purposes
export { BaseApiClient };

// Re-export types for backward compatibility
export type { BaseApiResponse, BaseApiRequestOptions };

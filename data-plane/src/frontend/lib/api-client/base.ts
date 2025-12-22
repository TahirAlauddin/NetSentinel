/**
 * Base API client with shared functionality
 * This class contains common logic used by both client and server API clients
 */

import { parseApiError } from "./error-parser";
import type { BaseApiResponse, BaseApiRequestOptions } from "../../types/api-client";
import type { JWT } from "next-auth/jwt";

export abstract class BaseApiClientCore {
  protected abstract getApiBaseUrl(): string;
  protected abstract getSession(): Promise<JWT | null>;
  protected abstract refreshToken(refreshToken: string): Promise<string | null>;

  /**
   * Build a query string from params, filtering out undefined and null values
   */
  public buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return "";

    const filteredParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        filteredParams[key] = String(value);
      }
    }

    const queryString = new URLSearchParams(filteredParams).toString();
    return queryString ? `?${queryString}` : "";
  }

  /**
   * Parse error response from API
   */
  protected parseErrorResponse(errorData: unknown, status: number): string {
    const parsed = parseApiError(errorData);
    // If we got the default message (invalid error data), use status code version
    if (parsed.message === 'Request failed' && (!errorData || typeof errorData !== 'object')) {
      return `Request failed with status ${status}`;
    }
    return parsed.message || `Request failed with status ${status}`;
  }

  /**
   * Build full URL from endpoint
   */
  protected buildUrl(endpoint: string): string {
    const baseUrl = this.getApiBaseUrl();
    return endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;
  }

  /**
   * Build headers for request
   */
  protected buildHeaders(customHeaders?: HeadersInit, accessToken?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (accessToken) {
      return {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }

    return headers;
  }


  /**
   * Handle successful response
   */
  protected async handleSuccessResponse<T>(response: Response): Promise<BaseApiResponse<T>> {
    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
    };
  }

  /**
   * Handle error response
   */
  protected async handleErrorResponse<T>(response: Response): Promise<BaseApiResponse<T>> {
    let errorMessage = "Request failed";
    let errorData: unknown = null;

    try {
      errorData = await response.json();
      errorMessage = this.parseErrorResponse(errorData, response.status);
    } catch {
      errorMessage = `Request failed with status ${response.status}`;
    }

    return {
      error: errorMessage,
      status: response.status,
      errorData,
    };
  }

  /**
   * Core request method - handles the main request flow
   */
  protected async executeRequest<T>(
    endpoint: string,
    options: BaseApiRequestOptions = {}
  ): Promise<BaseApiResponse<T>> {
    const { requireAuth = true, skipRefresh = false, ...fetchOptions } = options;

    const url = this.buildUrl(endpoint);

    // Get session and add auth headers if required
    let accessToken: string | undefined;
    if (requireAuth) {
      const session = await this.getSession();
      if (!session?.accessToken) {
        return {
          error: "No access token available",
          status: 401,
        };
      }
      accessToken = session.accessToken;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: this.buildHeaders(fetchOptions.headers as HeadersInit, accessToken),
      });

      // Handle error responses
      if (!response.ok) {
        return await this.handleErrorResponse<T>(response);
      }

      // Handle successful responses
      return await this.handleSuccessResponse<T>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }
}

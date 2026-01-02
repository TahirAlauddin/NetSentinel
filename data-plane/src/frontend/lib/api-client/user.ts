import { BaseApiClient, BaseApiResponse } from ".";
import { UserRecord } from "@/types/users";

/**
 * Users API Methods
 */
export class UserApiClient extends BaseApiClient {
  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<BaseApiResponse<UserRecord>> {
    return this.get<UserRecord>(`/auth/users/me/`);
  }

  /**
   * Get all users
   */
  async getUsers<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/users/users${queryString}/`);
  }

  /**
   * Get a specific user by ID
   */
  async getUser<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/users/users/${id}/`);
  }
}

import { BaseApiClient, BaseApiResponse } from ".";

/**
 * Users API Methods
 */
export class UserApiClient extends BaseApiClient {
  /**
   * Get all users
   */
  async getUsers<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/users/users${queryString}`);
  }

  /**
   * Get a specific user by ID
   */
  async getUser<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/users/users/${id}/`);
  }
}

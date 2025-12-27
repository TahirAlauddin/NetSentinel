// ============================================================================
// Telecom API Methods
// ============================================================================

import { BaseApiClient, BaseApiResponse } from "./index";

export class TelecomApiClient extends BaseApiClient {

  /********************************************************************************************/

  /**
   * Get all providers
   */
  async getProviders<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/telecom/providers${queryString}/`);
  }

  /**
   * Get a specific provider by ID
   */
  async getProvider<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/telecom/providers/${id}/`);
  }

  /**
   * Create a new provider
   */
  async createProvider<T = any>(data: any): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/telecom/providers/`, data);
  }

  /**
   * Update a provider by ID
   */
  async updateProvider<T = any>(id: number | string, data: any): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/telecom/providers/${id}/`, data);
  }

  /**
   * Delete a provider by ID
   */
  async deleteProvider<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/telecom/providers/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all data circuits
   */
  async getDataCircuits<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/telecom/data-circuits${queryString}/`);
  }

  /**
   * Get a specific data circuit by ID
   */
  async getDataCircuit<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/telecom/data-circuits/${id}/`);
  }

  /**
   * Create a new data circuit
   */
  async createDataCircuit<T = any>(data: any): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/telecom/data-circuits/`, data);
  }

  /**
   * Update a data circuit by ID
   */
  async updateDataCircuit<T = any>(id: number | string, data: any): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/telecom/data-circuits/${id}/`, data);
  }

  /**
   * Delete a data circuit by ID
   */
  async deleteDataCircuit<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/telecom/data-circuits/${id}/`);
  }
}


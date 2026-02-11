// ============================================================================
// Telecom API Methods
// ============================================================================

import { BaseApiClient, BaseApiResponse } from "./index";
import { DataCircuitCreateDto } from "@/types/data-circuits";
import { PhoneNumberCreateDto } from "@/types/phone-numbers";
import { ProviderCreateDto } from "@/types/providers";
import { ServiceCreateDto } from "@/types/services";

export class TelecomApiClient extends BaseApiClient {

  /********************************************************************************************/

  /**
   * Get all providers
   */
  async getProviders<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/telecom/providers${queryString}/`);
  }

  /**
   * Get a specific provider by ID
   */
  async getProvider<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/telecom/providers/${id}/`);
  }

  /**
   * Create a new provider
   */
  async createProvider<T = unknown>(data: ProviderCreateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/telecom/providers/`, data);
  }

  /**
   * Update a provider by ID
   */
  async updateProvider<T = unknown>(id: number | string, data: ProviderCreateDto): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/telecom/providers/${id}/`, data);
  }

  /**
   * Delete a provider by ID
   */
  async deleteProvider<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/telecom/providers/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all services (business-facing; distinct from data circuits)
   */
  async getServices<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/telecom/services${queryString}/`);
  }

  /**
   * Get a specific service by ID
   */
  async getService<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/telecom/services/${id}/`);
  }

  /**
   * Create a new service
   */
  async createService<T = unknown>(data: ServiceCreateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/telecom/services/`, data);
  }

  /**
   * Update a service by ID
   */
  async updateService<T = unknown>(
    id: number | string,
    data: ServiceCreateDto
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/telecom/services/${id}/`, data);
  }

  /**
   * Delete a service by ID
   */
  async deleteService<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/telecom/services/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all data circuits
   */
  async getDataCircuits<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/telecom/data-circuits${queryString}/`);
  }

  /**
   * Get a specific data circuit by ID
   */
  async getDataCircuit<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/telecom/data-circuits/${id}/`);
  }

  /**
   * Create a new data circuit
   */
  async createDataCircuit<T = unknown>(data: DataCircuitCreateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/telecom/data-circuits/`, data);
  }

  /**
   * Update a data circuit by ID
   */
  async updateDataCircuit<T = unknown>(id: number | string, data: DataCircuitCreateDto): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/telecom/data-circuits/${id}/`, data);
  }

  /**
   * Delete a data circuit by ID
   */
  async deleteDataCircuit<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/telecom/data-circuits/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all phone numbers
   */
  async getPhoneNumbers<T = unknown>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/telecom/phone-numbers${queryString}/`);
  }

  /**
   * Get a specific phone number by ID
   */
  async getPhoneNumber<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/telecom/phone-numbers/${id}/`);
  }

  /**
   * Create a new phone number
   */
  async createPhoneNumber<T = unknown>(
    data: PhoneNumberCreateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/telecom/phone-numbers/`, data);
  }

  /**
   * Update a phone number by ID
   */
  async updatePhoneNumber<T = unknown>(
    id: number | string,
    data: PhoneNumberCreateDto
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/telecom/phone-numbers/${id}/`, data);
  }

  /**
   * Delete a phone number by ID
   */
  async deletePhoneNumber<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/telecom/phone-numbers/${id}/`);
  }
}


// ============================================================================
// Phone Management API Methods
// ============================================================================

import { BaseApiClient, BaseApiResponse } from "./index";
import type {
  ManagedPhoneNumberCreateDto,
  ManagedPhoneNumberBlockCreateDto,
} from "@/types/phone-management";

export class PhoneManagementApiClient extends BaseApiClient {
  /**
   * Get all managed phone numbers
   */
  async getManagedNumbers<T = unknown>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/phone-management/numbers${queryString}/`);
  }

  /**
   * Get a managed phone number by ID
   */
  async getManagedNumber<T = unknown>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/phone-management/numbers/${id}/`);
  }

  /**
   * Create a managed phone number
   */
  async createManagedNumber<T = unknown>(
    data: ManagedPhoneNumberCreateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/phone-management/numbers/`, data);
  }

  /**
   * Update a managed phone number by ID
   */
  async updateManagedNumber<T = unknown>(
    id: number | string,
    data: Partial<ManagedPhoneNumberCreateDto>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/phone-management/numbers/${id}/`, data);
  }

  /**
   * Delete a managed phone number by ID
   */
  async deleteManagedNumber<T = unknown>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/phone-management/numbers/${id}/`);
  }

  /**
   * Get all managed phone number blocks
   */
  async getManagedBlocks<T = unknown>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/phone-management/blocks${queryString}/`);
  }

  /**
   * Get a managed phone number block by ID
   */
  async getManagedBlock<T = unknown>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/phone-management/blocks/${id}/`);
  }

  /**
   * Create a managed phone number block
   */
  async createManagedBlock<T = unknown>(
    data: ManagedPhoneNumberBlockCreateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/phone-management/blocks/`, data);
  }

  /**
   * Update a managed phone number block by ID
   */
  async updateManagedBlock<T = unknown>(
    id: number | string,
    data: Partial<ManagedPhoneNumberBlockCreateDto>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/phone-management/blocks/${id}/`, data);
  }

  /**
   * Delete a managed phone number block by ID
   */
  async deleteManagedBlock<T = unknown>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/phone-management/blocks/${id}/`);
  }
}

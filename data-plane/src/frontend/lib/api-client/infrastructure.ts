// ============================================================================
// Infrastructure API Methods
// ============================================================================

import { LocationCreateDto } from "@/types/locations";
import { CarrierContactCreateDto } from "@/types/carrier-contacts";
import { BaseApiClient, BaseApiResponse } from "./index";



export class InfrastructureApiClient extends BaseApiClient {

  async getLocations<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/locations${queryString}/`);
  }

  /**
   * Get a specific location by ID
   */
  async getLocation<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/locations/${id}/`);
  }

  async createLocation<T = unknown>(data: LocationCreateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/infrastructure/locations/`, data);
  }

  /********************************************************************************************/

  /**
   * Get all circuits
   */
  async getCircuits<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/circuits${queryString}/`);
  }

  /**
   * Get a specific circuit by ID
   */
  async getCircuit<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/circuits/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all points of contact
   */
  async getPointsOfContact<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/points-of-contact${queryString}/`);
  }

  /**
   * Get a specific point of contact by ID
   */
  async getPointOfContact<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/points-of-contact/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all departments
   */
  async getDepartments<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/departments${queryString}/`);
  }

  /**
   * Get a specific department by ID
   */
  async getDepartment<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/departments/${id}/`);
  }

  /********************************************************************************************/
  
  /**
   * Get all categories (infrastructure categories)
   */
  async getCategories<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/categories${queryString}/`);
  }

  /**
   * Get a specific category by ID (infrastructure category)
   */
  async getCategory<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/categories/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all contacts
   */
  async getContacts<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/contacts${queryString}/`);
  }

  /**
   * Get a specific contact by ID
   */
  async getContact<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/contacts/${id}/`);
  }

  /********************************************************************************************/

  /**
   * Get all carrier contacts
   */
  async getCarrierContacts<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/carrier-contacts${queryString}/`);
  }

  /**
   * Get a specific carrier contact by ID
   */
  async getCarrierContact<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/carrier-contacts/${id}/`);
  }

  /**
   * Create a new carrier contact
   */
  async createCarrierContact<T = unknown>(data: CarrierContactCreateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/infrastructure/carrier-contacts/`, data);
  }

  /**
   * Update a carrier contact by ID
   */
  async updateCarrierContact<T = unknown>(id: number | string, data: CarrierContactCreateDto): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/infrastructure/carrier-contacts/${id}/`, data);
  }

  /**
   * Delete a carrier contact by ID
   */
  async deleteCarrierContact<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/infrastructure/carrier-contacts/${id}/`);
  }
  
  /********************************************************************************************/

  /**
   * Get all utility contacts
   */
  async getUtilityContacts<T = unknown>(params?: Record<string, unknown>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/utility-contacts${queryString}/`);
  }

  /**
   * Get a specific utility contact by ID
   */
  async getUtilityContact<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/utility-contacts/${id}/`);
  }
}


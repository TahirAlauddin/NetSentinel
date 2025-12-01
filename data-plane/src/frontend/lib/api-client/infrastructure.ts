// ============================================================================
// Infrastructure API Methods
// ============================================================================

import { BaseApiClient, BaseApiResponse } from "./index";



export class InfrastructureApiClient extends BaseApiClient {

  async getLocations<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/locations${queryString}`);
  }

  /**
   * Get a specific location by ID
   */
  async getLocation<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/locations/${id}/`);
  }

  /**
   * Get all circuits
   */
  async getCircuits<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/circuits${queryString}`);
  }

  /**
   * Get a specific circuit by ID
   */
  async getCircuit<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/circuits/${id}/`);
  }

  /**
   * Get all points of contact
   */
  async getPointsOfContact<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/points-of-contact${queryString}`);
  }

  /**
   * Get a specific point of contact by ID
   */
  async getPointOfContact<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/points-of-contact/${id}/`);
  }

  /**
   * Get all departments
   */
  async getDepartments<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/departments${queryString}`);
  }

  /**
   * Get a specific department by ID
   */
  async getDepartment<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/departments/${id}/`);
  }

  /**
   * Get all categories (infrastructure categories)
   */
  async getCategories<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/categories${queryString}`);
  }

  /**
   * Get a specific category by ID (infrastructure category)
   */
  async getCategory<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/categories/${id}/`);
  }

  /**
   * Get all contacts
   */
  async getContacts<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/contacts${queryString}`);
  }

  /**
   * Get a specific contact by ID
   */
  async getContact<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/contacts/${id}/`);
  }

  /**
   * Get all carrier contacts
   */
  async getCarrierContacts<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/carrier-contacts${queryString}`);
  }

  /**
   * Get a specific carrier contact by ID
   */
  async getCarrierContact<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/carrier-contacts/${id}/`);
  }

  /**
   * Get all utility contacts
   */
  async getUtilityContacts<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/infrastructure/utility-contacts${queryString}`);
  }

  /**
   * Get a specific utility contact by ID
   */
  async getUtilityContact<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/infrastructure/utility-contacts/${id}/`);
  }
}


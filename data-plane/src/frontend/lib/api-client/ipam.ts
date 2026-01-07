import { BaseApiClient, BaseApiResponse } from "./index";
import {
  SubnetCreateUpdateDto,
  VlanCreateUpdateDto,
  VrfCreateUpdateDto,
  CustomerCreateUpdateDto,
  PaginatedResponse,
} from "@/types/ipam/dto";
import { Subnet, VLAN, VRF, Customer } from "@/types/ipam";

/**
 * IPAM API Client
 * Handles all IPAM-related API requests
 */
export class IpamApiClient extends BaseApiClient {
  /**
   * Get all subnets
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of subnets or paginated response
   */
  async getSubnets<T = Subnet[] | PaginatedResponse<Subnet>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/api/v1/ipam/subnets${queryString}`);
  }

  /**
   * Get a single subnet by ID
   * @param id - Subnet ID
   * @returns Subnet details
   */
  async getSubnet<T = Subnet>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/api/v1/ipam/subnets/${id}/`);
  }

  /**
   * Create a new subnet
   * @param subnet - Subnet data
   * @returns Created subnet
   */
  async createSubnet<T = Subnet>(
    subnet: SubnetCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/api/v1/ipam/subnets/", subnet);
  }

  /**
   * Update a subnet
   * @param id - Subnet ID
   * @param subnet - Updated subnet data
   * @returns Updated subnet
   */
  async updateSubnet<T = Subnet>(
    id: number | string,
    subnet: SubnetCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/api/v1/ipam/subnets/${id}/`, subnet);
  }

  /**
   * Delete a subnet
   * @param id - Subnet ID
   * @returns Deletion response
   */
  async deleteSubnet<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/api/v1/ipam/subnets/${id}/`);
  }

  /**
   * Get all VLANs
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of VLANs or paginated response
   */
  async getVlans<T = VLAN[] | PaginatedResponse<VLAN>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/api/v1/ipam/vlans${queryString}`);
  }

  /**
   * Get a single VLAN by ID
   * @param id - VLAN ID
   * @returns VLAN details
   */
  async getVlan<T = VLAN>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/api/v1/ipam/vlans/${id}/`);
  }

  /**
   * Create a new VLAN
   * @param vlan - VLAN data
   * @returns Created VLAN
   */
  async createVlan<T = VLAN>(vlan: VlanCreateUpdateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>("/api/v1/ipam/vlans/", vlan);
  }

  /**
   * Update a VLAN
   * @param id - VLAN ID
   * @param vlan - Updated VLAN data
   * @returns Updated VLAN
   */
  async updateVlan<T = VLAN>(
    id: number | string,
    vlan: VlanCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/api/v1/ipam/vlans/${id}/`, vlan);
  }

  /**
   * Delete a VLAN
   * @param id - VLAN ID
   * @returns Deletion response
   */
  async deleteVlan<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/api/v1/ipam/vlans/${id}/`);
  }

  /**
   * Get all VRFs
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of VRFs or paginated response
   */
  async getVrfs<T = VRF[] | PaginatedResponse<VRF>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/api/v1/ipam/vrfs${queryString}`);
  }

  /**
   * Get a single VRF by ID
   * @param id - VRF ID
   * @returns VRF details
   */
  async getVrf<T = VRF>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/api/v1/ipam/vrfs/${id}/`);
  }

  /**
   * Create a new VRF
   * @param vrf - VRF data
   * @returns Created VRF
   */
  async createVrf<T = VRF>(vrf: VrfCreateUpdateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>("/api/v1/ipam/vrfs/", vrf);
  }

  /**
   * Update a VRF
   * @param id - VRF ID
   * @param vrf - Updated VRF data
   * @returns Updated VRF
   */
  async updateVrf<T = VRF>(
    id: number | string,
    vrf: VrfCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/api/v1/ipam/vrfs/${id}/`, vrf);
  }

  /**
   * Delete a VRF
   * @param id - VRF ID
   * @returns Deletion response
   */
  async deleteVrf<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/api/v1/ipam/vrfs/${id}/`);
  }

  /**
   * Get all customers
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of customers or paginated response
   */
  async getCustomers<T = Customer[] | PaginatedResponse<Customer>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/api/v1/ipam/customers${queryString}`);
  }

  /**
   * Get a single customer by ID
   * @param id - Customer ID
   * @returns Customer details
   */
  async getCustomer<T = Customer>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/api/v1/ipam/customers/${id}/`);
  }

  /**
   * Create a new customer
   * @param customer - Customer data
   * @returns Created customer
   */
  async createCustomer<T = Customer>(
    customer: CustomerCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/api/v1/ipam/customers/", customer);
  }

  /**
   * Update a customer
   * @param id - Customer ID
   * @param customer - Updated customer data
   * @returns Updated customer
   */
  async updateCustomer<T = Customer>(
    id: number | string,
    customer: CustomerCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/api/v1/ipam/customers/${id}/`, customer);
  }

  /**
   * Delete a customer
   * @param id - Customer ID
   * @returns Deletion response
   */
  async deleteCustomer<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/api/v1/ipam/customers/${id}/`);
  }

  /**
   * Get subnet groups (for dropdowns)
   * @returns List of subnet groups
   */
  async getSubnetGroups<T = Array<{ id: number; name: string }>>(): Promise<BaseApiResponse<T>> {
    return this.get<T>("/api/v1/ipam/subnet-groups/");
  }
}


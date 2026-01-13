import { BaseApiClient, BaseApiResponse } from "./index";
import {
  SubnetCreateUpdateDto,
  VlanCreateUpdateDto,
  VrfCreateUpdateDto,
  CustomerCreateUpdateDto,
  SubnetGroupCreateUpdateDto,
  IPRequestCreateDto,
  IPRequestApproveRejectDto,
  IPAssignDto,
  IPReleaseDto,
  PaginatedResponse,
} from "@/types/ipam/dto";
import {
  Subnet,
  VLAN,
  VRF,
  Customer,
  SubnetGroup,
  IPAddress,
  IPRequest,
  IPAssignmentHistory,
  PhoneNumberRange,
  SubnetUtilization,
  SubnetCapacity,
  UtilizationSummary,
} from "@/types/ipam";

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
    return this.get<T>(`/ipam/subnets${queryString}`);
  }

  /**
   * Get a single subnet by ID
   * @param id - Subnet ID
   * @returns Subnet details
   */
  async getSubnet<T = Subnet>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/subnets/${id}/`);
  }

  /**
   * Create a new subnet
   * @param subnet - Subnet data
   * @returns Created subnet
   */
  async createSubnet<T = Subnet>(
    subnet: SubnetCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/subnets/", subnet);
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
    return this.put<T>(`/ipam/subnets/${id}/`, subnet);
  }

  /**
   * Delete a subnet
   * @param id - Subnet ID
   * @returns Deletion response
   */
  async deleteSubnet<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/subnets/${id}/`);
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
    return this.get<T>(`/ipam/vlans${queryString}`);
  }

  /**
   * Get a single VLAN by ID
   * @param id - VLAN ID
   * @returns VLAN details
   */
  async getVlan<T = VLAN>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/vlans/${id}/`);
  }

  /**
   * Create a new VLAN
   * @param vlan - VLAN data
   * @returns Created VLAN
   */
  async createVlan<T = VLAN>(vlan: VlanCreateUpdateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/vlans/", vlan);
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
    return this.put<T>(`/ipam/vlans/${id}/`, vlan);
  }

  /**
   * Delete a VLAN
   * @param id - VLAN ID
   * @returns Deletion response
   */
  async deleteVlan<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/vlans/${id}/`);
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
    return this.get<T>(`/ipam/vrfs${queryString}`);
  }

  /**
   * Get a single VRF by ID
   * @param id - VRF ID
   * @returns VRF details
   */
  async getVrf<T = VRF>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/vrfs/${id}/`);
  }

  /**
   * Create a new VRF
   * @param vrf - VRF data
   * @returns Created VRF
   */
  async createVrf<T = VRF>(vrf: VrfCreateUpdateDto): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/vrfs/", vrf);
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
    return this.put<T>(`/ipam/vrfs/${id}/`, vrf);
  }

  /**
   * Delete a VRF
   * @param id - VRF ID
   * @returns Deletion response
   */
  async deleteVrf<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/vrfs/${id}/`);
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
    return this.get<T>(`/ipam/customers${queryString}`);
  }

  /**
   * Get a single customer by ID
   * @param id - Customer ID
   * @returns Customer details
   */
  async getCustomer<T = Customer>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/customers/${id}/`);
  }

  /**
   * Create a new customer
   * @param customer - Customer data
   * @returns Created customer
   */
  async createCustomer<T = Customer>(
    customer: CustomerCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/customers/", customer);
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
    return this.put<T>(`/ipam/customers/${id}/`, customer);
  }

  /**
   * Delete a customer
   * @param id - Customer ID
   * @returns Deletion response
   */
  async deleteCustomer<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/customers/${id}/`);
  }

  /**
   * Get all subnet groups
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of subnet groups or paginated response
   */
  async getSubnetGroups<T = SubnetGroup[] | PaginatedResponse<SubnetGroup>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnet-groups${queryString}`);
  }

  /**
   * Get a single subnet group by ID
   * @param id - Subnet Group ID
   * @returns Subnet Group details
   */
  async getSubnetGroup<T = SubnetGroup>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/subnet-groups/${id}/`);
  }

  /**
   * Create a new subnet group
   * @param group - Subnet Group data
   * @returns Created subnet group
   */
  async createSubnetGroup<T = SubnetGroup>(
    group: SubnetGroupCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/subnet-groups/", group);
  }

  /**
   * Update a subnet group
   * @param id - Subnet Group ID
   * @param group - Updated subnet group data
   * @returns Updated subnet group
   */
  async updateSubnetGroup<T = SubnetGroup>(
    id: number | string,
    group: SubnetGroupCreateUpdateDto
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/subnet-groups/${id}/`, group);
  }

  /**
   * Delete a subnet group
   * @param id - Subnet Group ID
   * @returns Deletion response
   */
  async deleteSubnetGroup<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/subnet-groups/${id}/`);
  }

  /**
   * Add a subnet to favorites
   * @param id - Subnet ID
   * @returns Updated subnet
   */
  async addSubnetToFavorites<T = Subnet>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/subnets/${id}/favorite/`, {});
  }

  /**
   * Remove a subnet from favorites
   * @param id - Subnet ID
   * @returns Updated subnet
   */
  async removeSubnetFromFavorites<T = Subnet>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/subnets/${id}/favorite/`);
  }

  /**
   * Toggle favorite status of a subnet
   * @param id - Subnet ID
   * @param isFavorite - Whether to add or remove from favorites
   * @returns Updated subnet
   */
  async toggleSubnetFavorite<T = Subnet>(
    id: number | string,
    isFavorite: boolean
  ): Promise<BaseApiResponse<T>> {
    if (isFavorite) {
      return this.addSubnetToFavorites<T>(id);
    } else {
      return this.removeSubnetFromFavorites<T>(id);
    }
  }

  // ==================== IP Address Management ====================

  /**
   * Get all IP addresses
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of IP addresses or paginated response
   */
  async getIPAddresses<T = IPAddress[] | PaginatedResponse<IPAddress>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-addresses${queryString}`);
  }

  /**
   * Get a single IP address by ID
   * @param id - IP address ID
   * @returns IP address details
   */
  async getIPAddress<T = IPAddress>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-addresses/${id}/`);
  }

  /**
   * Assign an IP address to an asset
   * @param id - IP address ID
   * @param data - Assignment data
   * @returns Updated IP address
   */
  async assignIPAddress<T = IPAddress>(
    id: number | string,
    data: IPAssignDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/ip-addresses/${id}/assign/`, data);
  }

  /**
   * Release an IP address from asset
   * @param id - IP address ID
   * @param data - Release data
   * @returns Updated IP address
   */
  async releaseIPAddress<T = IPAddress>(
    id: number | string,
    data?: IPReleaseDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/ip-addresses/${id}/release/`, data || {});
  }

  /**
   * Get assignment history for an IP address
   * @param id - IP address ID
   * @returns List of assignment history entries
   */
  async getIPAddressHistory<T = IPAssignmentHistory[]>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-addresses/${id}/history/`);
  }

  /**
   * Auto-assign IP from subnet to asset
   * @param subnetId - Subnet ID
   * @param data - Assignment data
   * @returns Created IP address
   */
  async autoAssignIPFromSubnet<T = IPAddress>(
    subnetId: number | string,
    data: IPAssignDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/subnets/${subnetId}/auto-assign/`, data);
  }

  // ==================== IP Request Management ====================

  /**
   * Get all IP requests
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of IP requests or paginated response
   */
  async getIPRequests<T = IPRequest[] | PaginatedResponse<IPRequest>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-requests${queryString}`);
  }

  /**
   * Get a single IP request by ID
   * @param id - IP request ID
   * @returns IP request details
   */
  async getIPRequest<T = IPRequest>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-requests/${id}/`);
  }

  /**
   * Create a new IP request
   * @param request - IP request data
   * @returns Created IP request
   */
  async createIPRequest<T = IPRequest>(
    request: IPRequestCreateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-requests/", request);
  }

  /**
   * Create IP request for a specific subnet
   * @param subnetId - Subnet ID
   * @param request - IP request data
   * @returns Created IP request
   */
  async createSubnetIPRequest<T = IPRequest>(
    subnetId: number | string,
    request: IPRequestCreateDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/subnets/${subnetId}/ip-requests/`, request);
  }

  /**
   * Approve an IP request
   * @param id - IP request ID
   * @param data - Approval data
   * @returns Updated IP request
   */
  async approveIPRequest<T = IPRequest>(
    id: number | string,
    data?: IPRequestApproveRejectDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/ip-requests/${id}/approve/`, data || {});
  }

  /**
   * Reject an IP request
   * @param id - IP request ID
   * @param data - Rejection data
   * @returns Updated IP request
   */
  async rejectIPRequest<T = IPRequest>(
    id: number | string,
    data?: IPRequestApproveRejectDto
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/ip-requests/${id}/reject/`, data || {});
  }

  /**
   * Get IP requests for a specific subnet
   * @param subnetId - Subnet ID
   * @param params - Optional query parameters
   * @returns List of IP requests for the subnet
   */
  async getSubnetIPRequests<T = IPRequest[] | PaginatedResponse<IPRequest>>(
    subnetId: number | string,
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnets/${subnetId}/ip-requests${queryString}`);
  }

  // ==================== Subnet Utilization Analytics ====================

  /**
   * Get utilization statistics for a subnet
   * @param id - Subnet ID
   * @returns Utilization data
   */
  async getSubnetUtilization<T = SubnetUtilization>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/subnets/${id}/utilization/`);
  }

  /**
   * Get capacity planning data for a subnet
   * @param id - Subnet ID
   * @param growthRate - Monthly growth rate (optional)
   * @param months - Number of months to project (optional)
   * @returns Capacity planning data
   */
  async getSubnetCapacity<T = SubnetCapacity>(
    id: number | string,
    growthRate?: number,
    months?: number
  ): Promise<BaseApiResponse<T>> {
    const params: Record<string, unknown> = {};
    if (growthRate !== undefined) params.growth_rate = growthRate;
    if (months !== undefined) params.months = months;
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnets/${id}/capacity${queryString}`);
  }

  /**
   * Get utilization for all subnets
   * @param params - Optional filters (location, group, status, threshold, etc.)
   * @returns List of utilization data
   */
  async getAllSubnetsUtilization<T = SubnetUtilization[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnets/utilization/all${queryString}`);
  }

  /**
   * Get overall utilization summary
   * @returns Utilization summary
   */
  async getUtilizationSummary<T = UtilizationSummary>(): Promise<BaseApiResponse<T>> {
    return this.get<T>("/ipam/subnets/utilization/summary/");
  }

  // ==================== IP Address Search & Discovery ====================

  /**
   * Advanced search for IP addresses
   * @param params - Search parameters (q, status, subnet, assigned_to_asset, etc.)
   * @returns List of matching IP addresses
   */
  async searchIPAddresses<T = IPAddress[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-addresses/search${queryString}`);
  }

  /**
   * Search IP addresses in a range
   * @param startIP - Starting IP address
   * @param endIP - Ending IP address
   * @param subnetId - Optional subnet ID filter
   * @returns List of IP addresses in range
   */
  async searchIPRange<T = IPAddress[]>(
    startIP: string,
    endIP: string,
    subnetId?: number
  ): Promise<BaseApiResponse<T>> {
    const params: Record<string, unknown> = { start: startIP, end: endIP };
    if (subnetId !== undefined) params.subnet = subnetId;
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-addresses/range${queryString}`);
  }

  /**
   * Search IP addresses by hostname
   * @param hostname - Hostname or FQDN
   * @returns List of matching IP addresses
   */
  async searchByHostname<T = IPAddress[]>(hostname: string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-addresses/hostname/?hostname=${encodeURIComponent(hostname)}`);
  }

  /**
   * Get comprehensive details for an IP address
   * @param ipAddress - IP address
   * @returns IP address details
   */
  async getIPDetails<T = unknown>(ipAddress: string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-addresses/${encodeURIComponent(ipAddress)}/details/`);
  }

  /**
   * Detect IP address conflicts
   * @param ipAddress - IP address to check
   * @param excludeSubnetId - Optional subnet ID to exclude
   * @returns List of conflicts
   */
  async detectIPConflicts<T = unknown>(
    ipAddress: string,
    excludeSubnetId?: number
  ): Promise<BaseApiResponse<T>> {
    const params: Record<string, unknown> = {};
    if (excludeSubnetId !== undefined) params.exclude_subnet = excludeSubnetId;
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-addresses/${encodeURIComponent(ipAddress)}/conflicts${queryString}`);
  }

  /**
   * Find available IP addresses in a subnet
   * @param subnetId - Subnet ID
   * @param count - Number of available IPs to find
   * @returns List of available IP addresses
   */
  async findAvailableIPs<T = { available_ips: string[] }>(
    subnetId: number | string,
    count: number = 10
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-addresses/find-available/?subnet=${subnetId}&count=${count}`);
  }

  // ==================== IP Address Import/Export ====================

  /**
   * Import IP addresses from CSV or JSON file
   * @param file - File to import
   * @param format - File format: "csv" or "json" (optional, auto-detected)
   * @param skipDuplicates - Whether to skip duplicate IPs (default: true)
   * @returns Import results with validation errors and import statistics
   */
  async importIPAddresses<T = {
    valid_rows: number;
    total_rows: number;
    validation_errors: Array<{
      row: number;
      data: Record<string, unknown>;
      errors: string[];
    }>;
    results: {
      created: number;
      updated: number;
      skipped: number;
      errors: Array<{ address: string; error: string }>;
    };
  }>(
    file: File,
    format?: "csv" | "json",
    skipDuplicates: boolean = true
  ): Promise<BaseApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);
    if (format) {
      formData.append("format", format);
    }
    formData.append("skip_duplicates", skipDuplicates.toString());

    // Use fetch directly for FormData
    const session = await this.getSession();
    const accessToken = session?.accessToken;

    const response = await fetch(`${this.getApiBaseUrl()}/api/v1/ipam/ip-addresses/import/`, {
      method: "POST",
      headers: {
        "Authorization": accessToken ? `Bearer ${accessToken}` : "",
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Import failed" }));
      return {
        error: error.error || "Import failed",
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data: data as T,
      status: response.status,
    };
  }

  /**
   * Export IP addresses to CSV or JSON
   * @param format - Export format: "csv" or "json" (default: "csv")
   * @param filters - Optional filters (status, subnet, assigned_to_asset, etc.)
   * @returns Blob with exported data
   */
  async exportIPAddresses(
    format: "csv" | "json" = "csv",
    filters?: {
      status?: string;
      subnet?: number | string;
      assigned_to_asset?: number | string;
      customer?: number | string;
      location?: number | string;
    }
  ): Promise<Blob> {
    const params: Record<string, unknown> = { format };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value;
        }
      });
    }
    const queryString = this.buildQueryString(params);
    
    // Use fetch directly for blob response
    const session = await this.getSession();
    const accessToken = session?.accessToken;
    
    const response = await fetch(`${this.getApiBaseUrl()}/api/v1/ipam/ip-addresses/export${queryString}`, {
      method: "GET",
      headers: {
        "Authorization": accessToken ? `Bearer ${accessToken}` : "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Export failed" }));
      throw new Error(error.error || "Export failed");
    }

    return response.blob();
  }

  // ==================== Inactive Hosts Detection ====================

  /**
   * Get list of inactive IP addresses
   * @param params - Query parameters (threshold_days, status, subnet)
   * @returns List of inactive IP addresses
   */
  async getInactiveHosts<T = IPAddress[]>(
    params?: {
      threshold_days?: number;
      status?: string;
      subnet?: number | string;
    }
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-addresses/inactive-hosts${queryString}`);
  }

  /**
   * Get summary statistics for inactive hosts
   * @param thresholdDays - Number of days since last update to consider inactive
   * @returns Summary statistics
   */
  async getInactiveHostsSummary<T = {
    total_inactive: number;
    by_status: Record<string, number>;
    by_subnet: Record<string, number>;
    oldest_inactive: {
      address: string;
      last_updated: string | null;
      days_inactive: number;
    } | null;
    threshold_days: number;
  }>(thresholdDays?: number): Promise<BaseApiResponse<T>> {
    const params = thresholdDays ? { threshold_days: thresholdDays } : {};
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-addresses/inactive-hosts/summary${queryString}`);
  }

  /**
   * Bulk release inactive IP addresses
   * @param ipIds - List of IP address IDs to release
   * @param releaseReason - Reason for release
   * @returns Release results
   */
  async bulkReleaseInactiveHosts<T = {
    released: number;
    failed: number;
    errors: string[];
  }>(
    ipIds: number[],
    releaseReason?: string
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-addresses/inactive-hosts/bulk-release/", {
      ip_ids: ipIds,
      release_reason: releaseReason || "Inactive host cleanup",
    });
  }

  /**
   * Bulk mark inactive IP addresses as deprecated
   * @param ipIds - List of IP address IDs to deprecate
   * @param reason - Reason for deprecation
   * @returns Deprecation results
   */
  async bulkDeprecateInactiveHosts<T = {
    deprecated: number;
    failed: number;
    errors: string[];
  }>(
    ipIds: number[],
    reason?: string
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-addresses/inactive-hosts/bulk-deprecate/", {
      ip_ids: ipIds,
      reason: reason || "Inactive host",
    });
  }

  // ==================== Duplicates Detection ====================

  /**
   * Detect duplicate IP addresses
   * @returns List of duplicate IP addresses
   */
  async getDuplicateIPs<T = Array<{
    address: string;
    count: number;
    instances: Array<{
      id: number;
      subnet_id: number | null;
      subnet_network: string | null;
      status: string;
      assigned_to_asset_id: number | null;
      assigned_to_asset_name: string | null;
      description: string | null;
      created_at: string;
      updated_at: string | null;
    }>;
    conflicts: Array<{
      ip_id: number;
      subnet_id: number;
      subnet_network: string;
      status: string;
    }>;
  }>>(): Promise<BaseApiResponse<T>> {
    return this.get<T>("/ipam/ip-addresses/duplicates/");
  }

  /**
   * Get summary of all duplicates (IPs and subnets)
   * @returns Duplicates summary
   */
  async getDuplicatesSummary<T = {
    duplicate_ips_count: number;
    duplicate_subnets_count: number;
    total_duplicate_ips: number;
    duplicate_ips: Array<unknown>;
    duplicate_subnets: Array<unknown>;
  }>(): Promise<BaseApiResponse<T>> {
    return this.get<T>("/ipam/ip-addresses/duplicates/summary/");
  }

  /**
   * Get resolution suggestions for a duplicate IP address
   * @param address - IP address to get suggestions for
   * @returns Resolution suggestions
   */
  async getDuplicateResolutionSuggestion<T = {
    address: string;
    recommended_action: string | null;
    reason: string | null;
    ip_to_keep: number | null;
    ips_to_remove: number[];
  }>(address: string): Promise<BaseApiResponse<T>> {
    return this.get<T>(
      `/ipam/ip-addresses/duplicates/suggest/?address=${encodeURIComponent(address)}`
    );
  }

  /**
   * Resolve duplicate IP addresses
   * @param address - IP address to resolve
   * @param ipToKeep - ID of IP address to keep
   * @param ipsToRemove - List of IP address IDs to remove
   * @returns Resolution results
   */
  async resolveDuplicate<T = {
    resolved: number;
    failed: number;
    errors: string[];
  }>(
    address: string,
    ipToKeep: number,
    ipsToRemove: number[]
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-addresses/duplicates/resolve/", {
      address,
      ip_to_keep: ipToKeep,
      ips_to_remove: ipsToRemove,
    });
  }

  /**
   * Detect duplicate or overlapping subnets
   * @returns List of duplicate/overlapping subnets
   */
  async getDuplicateSubnets<T = Array<{
    subnet_id: number;
    subnet_network: string;
    description: string | null;
    overlaps: Array<{
      type: string;
      subnet_id: number;
      subnet_network: string;
      description: string | null;
    }>;
  }>>(): Promise<BaseApiResponse<T>> {
    return this.get<T>("/ipam/subnets/duplicates/");
  }

  // ==================== Phone Number Ranges ====================

  /**
   * Get all phone number ranges
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of phone number ranges or paginated response
   */
  async getPhoneNumberRanges<T = PhoneNumberRange[] | PaginatedResponse<PhoneNumberRange>>(
    params?: {
      location?: number | string;
      carrier?: string;
    }
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/phone-numbers${queryString}`);
  }

  /**
   * Get a single phone number range by ID
   * @param id - Phone number range ID
   * @returns Phone number range details
   */
  async getPhoneNumberRange<T = PhoneNumberRange>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/phone-numbers/${id}/`);
  }

  /**
   * Create a new phone number range
   * @param phoneNumberRange - Phone number range data
   * @returns Created phone number range
   */
  async createPhoneNumberRange<T = PhoneNumberRange>(
    phoneNumberRange: {
      location?: number | null;
      carrier?: string | null;
      trunk?: string | null;
      start_number: string;
      stop_number: string;
      notes?: string | null;
    }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/phone-numbers/", phoneNumberRange);
  }

  /**
   * Update a phone number range
   * @param id - Phone number range ID
   * @param phoneNumberRange - Updated phone number range data
   * @returns Updated phone number range
   */
  async updatePhoneNumberRange<T = PhoneNumberRange>(
    id: number | string,
    phoneNumberRange: {
      location?: number | null;
      carrier?: string | null;
      trunk?: string | null;
      start_number?: string;
      stop_number?: string;
      notes?: string | null;
    }
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/phone-numbers/${id}/`, phoneNumberRange);
  }

  /**
   * Delete a phone number range
   * @param id - Phone number range ID
   * @returns Deletion response
   */
  async deletePhoneNumberRange<T = unknown>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/phone-numbers/${id}/`);
  }
}


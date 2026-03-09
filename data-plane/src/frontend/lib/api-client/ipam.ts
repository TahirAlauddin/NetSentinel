/* eslint-disable max-lines */
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
  DHCPScope,
  DHCPLease,
  DHCPReservation,
  DHCPOption,
  DHCPScopeAvailability,
  SubnetMaskInfo,
  DHCPLeaseStatistics,
  IPPool,
  IPPoolUtilization,
  Device,
  DeviceType,
  Rack,
  IPTag,
  IPAddressTag,
  IPAuditLog,
  IPAuditLogFilter,
  IPNote,
  IPNoteAttachment,
  IPNoteComment,
  SubnetThreshold,
  SubnetThresholdAlert,
  NetworkScan,
  ScanResult,
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
   * Perform reverse DNS lookup for an IP address
   * @param ipAddress - IP address to lookup
   * @returns Reverse DNS lookup result with hostname
   */
  async reverseDNSLookup<T = { ip_address: string; hostname: string | null; found: boolean }>(
    ipAddress: string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-addresses/reverse-dns/?ip=${encodeURIComponent(ipAddress)}`);
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

  // ==================== DHCP Management ====================

  /**
   * Get all DHCP scopes
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of DHCP scopes or paginated response
   */
  async getDHCPScopes<T = DHCPScope[] | PaginatedResponse<DHCPScope>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/dhcp-scopes${queryString}`);
  }

  /**
   * Get a single DHCP scope by ID
   * @param id - DHCP scope ID
   * @returns DHCP scope details
   */
  async getDHCPScope<T = DHCPScope>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/dhcp-scopes/${id}/`);
  }

  /**
   * Create a new DHCP scope
   * @param scope - DHCP scope data
   * @returns Created DHCP scope
   */
  async createDHCPScope<T = DHCPScope>(
    scope: Partial<DHCPScope>
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/dhcp-scopes/", scope);
  }

  /**
   * Update a DHCP scope
   * @param id - DHCP scope ID
   * @param scope - Updated DHCP scope data
   * @returns Updated DHCP scope
   */
  async updateDHCPScope<T = DHCPScope>(
    id: number | string,
    scope: Partial<DHCPScope>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/dhcp-scopes/${id}/`, scope);
  }

  /**
   * Delete a DHCP scope
   * @param id - DHCP scope ID
   * @returns Deletion response
   */
  async deleteDHCPScope<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/dhcp-scopes/${id}/`);
  }

  /**
   * Get availability statistics for a DHCP scope
   * @param id - DHCP scope ID
   * @returns Availability statistics
   */
  async getDHCPScopeAvailability<T = DHCPScopeAvailability>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/dhcp-scopes/${id}/availability/`);
  }

  /**
   * Get all leases for a DHCP scope
   * @param id - DHCP scope ID
   * @param params - Optional query parameters
   * @returns List of DHCP leases
   */
  async getDHCPScopeLeases<T = DHCPLease[]>(
    id: number | string,
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/dhcp-scopes/${id}/leases${queryString}`);
  }

  /**
   * Get all reservations for a DHCP scope
   * @param id - DHCP scope ID
   * @returns List of DHCP reservations
   */
  async getDHCPScopeReservations<T = DHCPReservation[]>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/dhcp-scopes/${id}/reservations/`);
  }

  /**
   * Automatically assign an IP from a DHCP scope
   * @param id - DHCP scope ID
   * @param data - Assignment data (mac_address, hostname)
   * @returns Assigned IP address
   */
  async assignIPFromDHCPScope<T = { ip_address: string }>(
    id: number | string,
    data: { mac_address: string; hostname?: string }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/dhcp-scopes/${id}/assign_ip/`, data);
  }

  /**
   * Export DHCP scope configuration
   * @param id - DHCP scope ID
   * @param format - Configuration format (isc-dhcpd, windows-dhcp)
   * @returns Configuration file content
   */
  async exportDHCPScopeConfig(
    id: number | string,
    format: string = "isc-dhcpd"
  ): Promise<Blob> {
    const session = await this.getSession();
    const accessToken = session?.accessToken;
    
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const url = this.buildUrl(`/ipam/dhcp-scopes/${id}/export-config/?format=${format}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export config: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get all DHCP leases
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of DHCP leases or paginated response
   */
  async getDHCPLeases<T = DHCPLease[] | PaginatedResponse<DHCPLease>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/dhcp-leases${queryString}`);
  }

  /**
   * Get a single DHCP lease by ID
   * @param id - DHCP lease ID
   * @returns DHCP lease details
   */
  async getDHCPLease<T = DHCPLease>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/dhcp-leases/${id}/`);
  }

  /**
   * Create a new DHCP lease
   * @param lease - DHCP lease data
   * @returns Created DHCP lease
   */
  async createDHCPLease<T = DHCPLease>(
    lease: Partial<DHCPLease>
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/dhcp-leases/", lease);
  }

  /**
   * Release a DHCP lease
   * @param id - DHCP lease ID
   * @returns Updated DHCP lease
   */
  async releaseDHCPLease<T = DHCPLease>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/dhcp-leases/${id}/release/`, {});
  }

  /**
   * Expire all expired leases
   * @returns Number of expired leases
   */
  async expireAllDHCPLeases<T = { expired_count: number }>(): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/dhcp-leases/expire_all/", {});
  }

  /**
   * Get all DHCP reservations
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of DHCP reservations or paginated response
   */
  async getDHCPReservations<T = DHCPReservation[] | PaginatedResponse<DHCPReservation>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/dhcp-reservations${queryString}`);
  }

  /**
   * Get a single DHCP reservation by ID
   * @param id - DHCP reservation ID
   * @returns DHCP reservation details
   */
  async getDHCPReservation<T = DHCPReservation>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/dhcp-reservations/${id}/`);
  }

  /**
   * Create a new DHCP reservation
   * @param reservation - DHCP reservation data
   * @returns Created DHCP reservation
   */
  async createDHCPReservation<T = DHCPReservation>(
    reservation: Partial<DHCPReservation>
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/dhcp-reservations/", reservation);
  }

  /**
   * Update a DHCP reservation
   * @param id - DHCP reservation ID
   * @param reservation - Updated DHCP reservation data
   * @returns Updated DHCP reservation
   */
  async updateDHCPReservation<T = DHCPReservation>(
    id: number | string,
    reservation: Partial<DHCPReservation>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/dhcp-reservations/${id}/`, reservation);
  }

  /**
   * Delete a DHCP reservation
   * @param id - DHCP reservation ID
   * @returns Deletion response
   */
  async deleteDHCPReservation<T = unknown>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/dhcp-reservations/${id}/`);
  }

  /**
   * Get DHCP lease statistics
   * @param scopeId - Optional scope ID to filter by
   * @returns Lease statistics
   */
  async getDHCPLeaseStatistics<T = DHCPLeaseStatistics>(
    scopeId?: number | string
  ): Promise<BaseApiResponse<T>> {
    const queryString = scopeId ? `?scope=${scopeId}` : "";
    return this.get<T>(`/ipam/dhcp-reservations/statistics/${queryString}`);
  }

  // ==================== DHCP Options Management ====================

  /**
   * Get all DHCP options
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of DHCP options or paginated response
   */
  async getDHCPOptions<T = DHCPOption[] | PaginatedResponse<DHCPOption>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/dhcp-options${queryString}`);
  }

  /**
   * Get all DHCP options for a scope
   * @param scopeId - DHCP scope ID
   * @returns List of DHCP options
   */
  async getDHCPScopeOptions<T = DHCPOption[]>(
    scopeId: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/dhcp-scopes/${scopeId}/options/`);
  }

  /**
   * Get a single DHCP option by ID
   * @param id - DHCP option ID
   * @returns DHCP option details
   */
  async getDHCPOption<T = DHCPOption>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/dhcp-options/${id}/`);
  }

  /**
   * Create a new DHCP option
   * @param option - DHCP option data
   * @returns Created DHCP option
   */
  async createDHCPOption<T = DHCPOption>(
    option: Partial<DHCPOption>
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/dhcp-options/", option);
  }

  /**
   * Create a DHCP option for a scope
   * @param scopeId - DHCP scope ID
   * @param option - DHCP option data
   * @returns Created DHCP option
   */
  async createDHCPScopeOption<T = DHCPOption>(
    scopeId: number | string,
    option: Partial<DHCPOption>
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/dhcp-scopes/${scopeId}/options/`, option);
  }

  /**
   * Update a DHCP option
   * @param id - DHCP option ID
   * @param option - Updated DHCP option data
   * @returns Updated DHCP option
   */
  async updateDHCPOption<T = DHCPOption>(
    id: number | string,
    option: Partial<DHCPOption>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/dhcp-options/${id}/`, option);
  }

  /**
   * Delete a DHCP option
   * @param id - DHCP option ID
   * @returns Deletion response
   */
  async deleteDHCPOption<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/dhcp-options/${id}/`);
  }

  // ==================== IP Pool Management ====================

  /**
   * Get all IP pools
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of IP pools or paginated response
   */
  async getIPPools<T = IPPool[] | PaginatedResponse<IPPool>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-pools${queryString}`);
  }

  /**
   * Get a single IP pool by ID
   * @param id - IP pool ID
   * @returns IP pool details
   */
  async getIPPool<T = IPPool>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-pools/${id}/`);
  }

  /**
   * Create a new IP pool
   * @param pool - IP pool data
   * @returns Created IP pool
   */
  async createIPPool<T = IPPool>(pool: Partial<IPPool>): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-pools/", pool);
  }

  /**
   * Update an IP pool
   * @param id - IP pool ID
   * @param pool - Updated IP pool data
   * @returns Updated IP pool
   */
  async updateIPPool<T = IPPool>(
    id: number | string,
    pool: Partial<IPPool>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/ip-pools/${id}/`, pool);
  }

  /**
   * Delete an IP pool
   * @param id - IP pool ID
   * @returns Deletion response
   */
  async deleteIPPool<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/ip-pools/${id}/`);
  }

  /**
   * Get utilization statistics for an IP pool
   * @param id - IP pool ID
   * @returns Utilization statistics
   */
  async getIPPoolUtilization<T = IPPoolUtilization>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-pools/${id}/utilization/`);
  }

  /**
   * Assign an IP address from a pool
   * @param id - IP pool ID
   * @param description - Optional description for the IP
   * @returns Assigned IP address
   */
  async assignIPFromPool<T = IPAddress>(
    id: number | string,
    description?: string
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/ip-pools/${id}/assign_ip/`, { description });
  }

  /**
   * Get utilization for all pools
   * @param subnetId - Optional subnet ID to filter by
   * @returns List of pool utilization statistics
   */
  async getAllIPPoolsUtilization<T = IPPoolUtilization[]>(
    subnetId?: number | string
  ): Promise<BaseApiResponse<T>> {
    const queryString = subnetId ? `?subnet=${subnetId}` : "";
    return this.get<T>(`/ipam/ip-pools/utilization_all/${queryString}`);
  }

  // ==================== Subnet Mask Reference ====================

  /**
   * Get all subnet mask information
   * @param params - Optional query parameters (ipv6, common, min_prefix, max_prefix)
   * @returns List of subnet mask information
   */
  async getSubnetMasks<T = SubnetMaskInfo[]>(
    params?: {
      ipv6?: boolean;
      common?: boolean;
      min_prefix?: number;
      max_prefix?: number;
    }
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnet-masks${queryString}`);
  }

  /**
   * Get detailed information for a specific subnet mask
   * @param prefixLength - CIDR prefix length
   * @param ipv6 - Whether this is an IPv6 mask
   * @returns Subnet mask information
   */
  async getSubnetMask<T = SubnetMaskInfo>(
    prefixLength: number,
    ipv6?: boolean
  ): Promise<BaseApiResponse<T>> {
    const queryString = ipv6 ? "?ipv6=true" : "";
    return this.get<T>(`/ipam/subnet-masks/${prefixLength}/${queryString}`);
  }

  // ==================== Device Management ====================

  /**
   * Get all devices
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of devices or paginated response
   */
  async getDevices<T = Device[] | PaginatedResponse<Device>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/devices${queryString}`);
  }

  /**
   * Get a single device by ID
   * @param id - Device ID
   * @returns Device details
   */
  async getDevice<T = Device>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/devices/${id}/`);
  }

  /**
   * Create a new device
   * @param device - Device data
   * @returns Created device
   */
  async createDevice<T = Device>(device: Partial<Device>): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/devices/", device);
  }

  /**
   * Update a device
   * @param id - Device ID
   * @param device - Updated device data
   * @returns Updated device
   */
  async updateDevice<T = Device>(
    id: number | string,
    device: Partial<Device>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/devices/${id}/`, device);
  }

  /**
   * Delete a device
   * @param id - Device ID
   * @returns Deletion response
   */
  async deleteDevice<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/devices/${id}/`);
  }

  /**
   * Get device statistics
   * @returns Device statistics
   */
  async getDeviceStatistics<T = {
    total_devices: number;
    active_devices: number;
    inactive_devices: number;
    devices_by_type: Record<string, number>;
  }>(): Promise<BaseApiResponse<T>> {
    return this.get<T>("/ipam/devices/statistics/");
  }

  // ==================== Device Type Management ====================

  /**
   * Get all device types
   * @param params - Optional query parameters
   * @returns List of device types
   */
  async getDeviceTypes<T = DeviceType[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/device-types${queryString}`);
  }

  /**
   * Get a single device type by ID
   * @param id - Device type ID
   * @returns Device type details
   */
  async getDeviceType<T = DeviceType>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/device-types/${id}/`);
  }

  /**
   * Create a new device type
   * @param deviceType - Device type data
   * @returns Created device type
   */
  async createDeviceType<T = DeviceType>(
    deviceType: Partial<DeviceType>
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/device-types/", deviceType);
  }

  /**
   * Update a device type
   * @param id - Device type ID
   * @param deviceType - Updated device type data
   * @returns Updated device type
   */
  async updateDeviceType<T = DeviceType>(
    id: number | string,
    deviceType: Partial<DeviceType>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/device-types/${id}/`, deviceType);
  }

  /**
   * Delete a device type
   * @param id - Device type ID
   * @returns Deletion response
   */
  async deleteDeviceType<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/device-types/${id}/`);
  }

  // ==================== Rack Management ====================

  /**
   * Get all racks
   * @param params - Optional query parameters
   * @returns List of racks
   */
  async getRacks<T = Rack[] | PaginatedResponse<Rack>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/racks${queryString}`);
  }

  /**
   * Get a single rack by ID
   * @param id - Rack ID
   * @returns Rack details
   */
  async getRack<T = Rack>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/racks/${id}/`);
  }

  /**
   * Create a new rack
   * @param rack - Rack data
   * @returns Created rack
   */
  async createRack<T = Rack>(rack: Partial<Rack>): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/racks/", rack);
  }

  /**
   * Update a rack
   * @param id - Rack ID
   * @param rack - Updated rack data
   * @returns Updated rack
   */
  async updateRack<T = Rack>(
    id: number | string,
    rack: Partial<Rack>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/racks/${id}/`, rack);
  }

  /**
   * Delete a rack
   * @param id - Rack ID
   * @returns Deletion response
   */
  async deleteRack<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/racks/${id}/`);
  }

  // ==================== IP Tag Management ====================

  /**
   * Get all IP tags
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of IP tags or paginated response
   */
  async getIPTags<T = IPTag[] | PaginatedResponse<IPTag>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-tags${queryString}`);
  }

  /**
   * Get a single IP tag by ID
   * @param id - IP tag ID
   * @returns IP tag details
   */
  async getIPTag<T = IPTag>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-tags/${id}/`);
  }

  /**
   * Create a new IP tag
   * @param tag - IP tag data
   * @returns Created IP tag
   */
  async createIPTag<T = IPTag>(tag: Partial<IPTag>): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-tags/", tag);
  }

  /**
   * Update an IP tag
   * @param id - IP tag ID
   * @param tag - Updated IP tag data
   * @returns Updated IP tag
   */
  async updateIPTag<T = IPTag>(
    id: number | string,
    tag: Partial<IPTag>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/ip-tags/${id}/`, tag);
  }

  /**
   * Delete an IP tag
   * @param id - IP tag ID
   * @returns Deletion response
   */
  async deleteIPTag<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/ip-tags/${id}/`);
  }

  /**
   * Get IP addresses using a tag
   * @param id - IP tag ID
   * @returns List of IP addresses
   */
  async getIPTagUsage<T = IPAddress[]>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-tags/${id}/usage/`);
  }

  /**
   * Get IP address tags
   * @param params - Optional query parameters
   * @returns List of IP address tags
   */
  async getIPAddressTags<T = IPAddressTag[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-address-tags${queryString}`);
  }

  /**
   * Apply a tag to an IP address
   * @param data - Tag application data
   * @returns Created IP address tag
   */
  async applyIPTag<T = IPAddressTag>(
    data: { ip_address: number; tag: number; notes?: string }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-address-tags/", data);
  }

  /**
   * Remove a tag from an IP address
   * @param id - IP address tag ID
   * @returns Deletion response
   */
  async removeIPTag<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/ip-address-tags/${id}/`);
  }

  /**
   * Bulk apply tags to IP addresses
   * @param data - Bulk application data
   * @returns Bulk operation result
   */
  async bulkApplyIPTags<T = { created: number; created_ids: number[]; errors: string[] }>(
    data: { ip_address_ids: number[]; tag_ids: number[]; notes?: string }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-address-tags/bulk-apply/", data);
  }

  /**
   * Bulk remove tags from IP addresses
   * @param data - Bulk removal data
   * @returns Bulk operation result
   */
  async bulkRemoveIPTags<T = { removed: number; errors: string[] }>(
    data: { ip_address_ids: number[]; tag_ids: number[] }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-address-tags/bulk-remove/", data);
  }

  // ==================== IP Audit Log ====================

  /**
   * Get IP audit logs
   * @param params - Optional query parameters for filtering
   * @returns List of audit logs
   */
  async getIPAuditLogs<T = IPAuditLog[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-audit-logs${queryString}`);
  }

  /**
   * Get audit log summary
   * @param params - Optional query parameters
   * @returns Audit log summary
   */
  async getIPAuditLogSummary<T = unknown>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-audit-logs/summary${queryString}`);
  }

  /**
   * Export audit logs to CSV
   * @param params - Optional query parameters
   * @returns CSV file blob
   */
  async exportIPAuditLogs(params?: Record<string, unknown>): Promise<Blob> {
    const queryString = this.buildQueryString(params);
    const session = await this.getSession();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(
      `${this.getApiBaseUrl()}/api/v1/ipam/ip-audit-logs/export/${queryString}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export audit logs");
    }

    return response.blob();
  }

  /**
   * Get saved audit log filters
   * @returns List of saved filters
   */
  async getIPAuditLogFilters<T = IPAuditLogFilter[]>(): Promise<BaseApiResponse<T>> {
    return this.get<T>("/ipam/ip-audit-log-filters/");
  }

  /**
   * Create a saved audit log filter
   * @param filter - Filter data
   * @returns Created filter
   */
  async createIPAuditLogFilter<T = IPAuditLogFilter>(
    filter: { name: string; filters: Record<string, unknown> }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-audit-log-filters/", filter);
  }

  /**
   * Delete a saved audit log filter
   * @param id - Filter ID
   * @returns Deletion response
   */
  async deleteIPAuditLogFilter<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/ip-audit-log-filters/${id}/`);
  }

  // ==================== IP Notes ====================

  /**
   * Get IP notes
   * @param params - Optional query parameters
   * @returns List of IP notes
   */
  async getIPNotes<T = IPNote[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-notes${queryString}`);
  }

  /**
   * Get a single IP note by ID
   * @param id - IP note ID
   * @returns IP note details
   */
  async getIPNote<T = IPNote>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-notes/${id}/`);
  }

  /**
   * Create a new IP note
   * @param note - IP note data
   * @returns Created IP note
   */
  async createIPNote<T = IPNote>(note: Partial<IPNote>): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-notes/", note);
  }

  /**
   * Update an IP note
   * @param id - IP note ID
   * @param note - Updated IP note data
   * @returns Updated IP note
   */
  async updateIPNote<T = IPNote>(
    id: number | string,
    note: Partial<IPNote>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/ip-notes/${id}/`, note);
  }

  /**
   * Delete an IP note
   * @param id - IP note ID
   * @returns Deletion response
   */
  async deleteIPNote<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/ip-notes/${id}/`);
  }

  /**
   * Get note versions
   * @param id - IP note ID
   * @returns List of note versions
   */
  async getIPNoteVersions<T = IPNote[]>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/ip-notes/${id}/versions/`);
  }

  /**
   * Pin or unpin a note
   * @param id - IP note ID
   * @returns Updated IP note
   */
  async pinIPNote<T = IPNote>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/ip-notes/${id}/pin/`, {});
  }

  /**
   * Upload a note attachment
   * @param data - Form data with file and note ID
   * @returns Created attachment
   */
  async uploadIPNoteAttachment<T = IPNoteAttachment>(
    data: FormData
  ): Promise<BaseApiResponse<T>> {
    // Don't set Content-Type for FormData - browser will set it with boundary
    return this.post<T>("/ipam/ip-note-attachments/", data);
  }

  /**
   * Delete a note attachment
   * @param id - Attachment ID
   * @returns Deletion response
   */
  async deleteIPNoteAttachment<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/ip-note-attachments/${id}/`);
  }

  /**
   * Get note comments
   * @param params - Optional query parameters
   * @returns List of comments
   */
  async getIPNoteComments<T = IPNoteComment[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/ip-note-comments${queryString}`);
  }

  /**
   * Create a note comment
   * @param comment - Comment data
   * @returns Created comment
   */
  async createIPNoteComment<T = IPNoteComment>(
    comment: { note: number; content: string }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/ip-note-comments/", comment);
  }

  /**
   * Update a note comment
   * @param id - Comment ID
   * @param comment - Updated comment data
   * @returns Updated comment
   */
  async updateIPNoteComment<T = IPNoteComment>(
    id: number | string,
    comment: { content: string }
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/ip-note-comments/${id}/`, comment);
  }

  /**
   * Delete a note comment
   * @param id - Comment ID
   * @returns Deletion response
   */
  async deleteIPNoteComment<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/ip-note-comments/${id}/`);
  }

  // ==================== Subnet Thresholds ====================

  /**
   * Get subnet thresholds
   * @param params - Optional query parameters
   * @returns List of subnet thresholds
   */
  async getSubnetThresholds<T = SubnetThreshold[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnet-thresholds${queryString}`);
  }

  /**
   * Get a single subnet threshold by ID
   * @param id - Threshold ID
   * @returns Threshold details
   */
  async getSubnetThreshold<T = SubnetThreshold>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/subnet-thresholds/${id}/`);
  }

  /**
   * Create a subnet threshold
   * @param threshold - Threshold data
   * @returns Created threshold
   */
  async createSubnetThreshold<T = SubnetThreshold>(
    threshold: Partial<SubnetThreshold>
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/subnet-thresholds/", threshold);
  }

  /**
   * Update a subnet threshold
   * @param id - Threshold ID
   * @param threshold - Updated threshold data
   * @returns Updated threshold
   */
  async updateSubnetThreshold<T = SubnetThreshold>(
    id: number | string,
    threshold: Partial<SubnetThreshold>
  ): Promise<BaseApiResponse<T>> {
    return this.put<T>(`/ipam/subnet-thresholds/${id}/`, threshold);
  }

  /**
   * Delete a subnet threshold
   * @param id - Threshold ID
   * @returns Deletion response
   */
  async deleteSubnetThreshold<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/subnet-thresholds/${id}/`);
  }

  /**
   * Manually check a subnet threshold
   * @param id - Threshold ID
   * @returns Check result
   */
  async checkSubnetThreshold<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/subnet-thresholds/${id}/check/`, {});
  }

  /**
   * Check all subnet thresholds
   * @returns Check results
   */
  async checkAllSubnetThresholds<T = unknown>(): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/subnet-thresholds/check-all/", {});
  }

  /**
   * Get threshold summary
   * @param params - Optional query parameters
   * @returns Summary statistics
   */
  async getSubnetThresholdSummary<T = unknown>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnet-thresholds/summary${queryString}`);
  }

  /**
   * Get subnet threshold alerts
   * @param params - Optional query parameters
   * @returns List of alerts
   */
  async getSubnetThresholdAlerts<T = SubnetThresholdAlert[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/subnet-threshold-alerts${queryString}`);
  }

  /**
   * Acknowledge a threshold alert
   * @param id - Alert ID
   * @returns Updated alert
   */
  async acknowledgeSubnetThresholdAlert<T = SubnetThresholdAlert>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/subnet-threshold-alerts/${id}/acknowledge/`, {});
  }

  /**
   * Bulk acknowledge threshold alerts
   * @param alertIds - Array of alert IDs
   * @returns Bulk operation result
   */
  async bulkAcknowledgeSubnetThresholdAlerts<T = { acknowledged: number }>(
    alertIds: number[]
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/subnet-threshold-alerts/bulk-acknowledge/", {
      alert_ids: alertIds,
    });
  }

  // ==================== Network Scans ====================

  /**
   * Get all network scans
   * @param params - Optional query parameters for filtering/pagination
   * @returns List of network scans or paginated response
   */
  async getNetworkScans<T = NetworkScan[] | PaginatedResponse<NetworkScan>>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/network-scans${queryString}`);
  }

  /**
   * Get a single network scan by ID
   * @param id - Network scan ID
   * @returns Network scan details
   */
  async getNetworkScan<T = NetworkScan>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/network-scans/${id}/`);
  }

  /**
   * Create a new network scan
   * @param scan - Network scan data
   * @returns Created network scan
   */
  async createNetworkScan<T = NetworkScan>(
    scan: { subnet: number; scan_type?: string; timeout?: number; max_hosts?: number | null }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>("/ipam/network-scans/", scan);
  }

  /**
   * Delete a network scan
   * @param id - Network scan ID
   * @returns Deletion response
   */
  async deleteNetworkScan<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/ipam/network-scans/${id}/`);
  }

  /**
   * Get scan results for a network scan
   * @param id - Network scan ID
   * @returns List of scan results
   */
  async getNetworkScanResults<T = ScanResult[]>(
    id: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/network-scans/${id}/results/`);
  }

  /**
   * Get scan summary for a network scan
   * @param id - Network scan ID
   * @returns Scan summary statistics
   */
  async getNetworkScanSummary<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/network-scans/${id}/summary/`);
  }

  /**
   * Import scan results into IPAM
   * @param id - Network scan ID
   * @param options - Import options
   * @returns Import results
   */
  async importNetworkScanResults<T = unknown>(
    id: number | string,
    options?: { import_new_hosts?: boolean; update_existing?: boolean }
  ): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/ipam/network-scans/${id}/import_results/`, options || {});
  }

  /**
   * Get all scan results
   * @param params - Optional query parameters
   * @returns List of scan results
   */
  async getScanResults<T = ScanResult[]>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/ipam/scan-results${queryString}`);
  }

  /**
   * Get a single scan result by ID
   * @param id - Scan result ID
   * @returns Scan result details
   */
  async getScanResult<T = ScanResult>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/ipam/scan-results/${id}/`);
  }
}


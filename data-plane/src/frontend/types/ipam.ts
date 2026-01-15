/**
 * IPAM TypeScript types
 * Type definitions for IP Address Management entities
 */

export interface Subnet {
  id: number;
  network: string;
  description?: string | null;
  group: number;
  group_detail?: {
    id: number;
    name: string;
    description?: string | null;
  };
  location: number;
  location_detail?: {
    id: number;
    name: string;
    address?: string | null;
  };
  vlan?: number | null;
  vlan_detail?: {
    id: number;
    name: string;
    vlan_id?: number | null;
  };
  vrf?: number | null;
  vrf_detail?: {
    id: number;
    name: string;
    description?: string | null;
  };
  gateway_ip?: string | null;
  nameservers?: string | null;
  master_subnet?: number | null;
  master_subnet_detail?: {
    id: number;
    network: string;
  } | null;
  customer?: number | null;
  customer_detail?: {
    id: number;
    name: string;
    address?: string | null;
    contact?: string | null;
  };
  is_ipv6: boolean;
  status: "planned" | "active" | "deprecated";
  status_display: string;
  child_subnets_count: number;
  ip_addresses_count: number;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubnetGroup {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VLAN {
  id: number;
  vlan_id: number;
  name: string;
  description?: string | null;
  location: number;
  location_detail?: {
    id: number;
    name: string;
    address?: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface VRF {
  id: number;
  name: string;
  rd?: string | null;
  description?: string | null;
  location?: number | null;
  location_detail?: {
    id: number;
    name: string;
    address?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubnetFilters {
  search?: string;
  vlan?: number;
  vrf?: number;
  customer?: number;
  location?: number;
  status?: "planned" | "active" | "deprecated";
  is_ipv6?: boolean;
}

export interface SubnetSortOptions {
  field: "network" | "description" | "vlan" | "vrf" | "customer" | "location" | "status" | "created_at";
  direction: "asc" | "desc";
}

// IP Address types
export interface IPAddress {
  id: number;
  address: string;
  subnet: number;
  subnet_detail?: {
    id: number;
    network: string;
    description?: string | null;
  } | null;
  status: "available" | "reserved" | "assigned" | "dhcp" | "deprecated";
  status_display: string;
  description?: string | null;
  assigned_to_asset?: number | null;
  assigned_to_asset_detail?: {
    id: number;
    name: string;
    asset_tag?: string | null;
  } | null;
  assigned_by?: number | null;
  assigned_by_detail?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  } | null;
  assigned_at?: string | null;
  created_at: string;
  updated_at: string;
}

// IP Request types
export interface IPRequest {
  id: number;
  requested_by: number;
  requested_by_detail?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  } | null;
  subnet: number;
  subnet_detail?: {
    id: number;
    network: string;
    description?: string | null;
  } | null;
  requested_ip?: string | null;
  status: "pending" | "approved" | "rejected" | "expired" | "completed";
  status_display: string;
  purpose: string;
  description?: string | null;
  approved_by?: number | null;
  approved_by_detail?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  } | null;
  approval_notes?: string | null;
  approved_at?: string | null;
  reservation_expires_at?: string | null;
  ip_address?: number | null;
  ip_address_detail?: {
    id: number;
    address: string;
    status: string;
    status_display: string;
  } | null;
  is_expired: boolean;
  can_be_approved: boolean;
  can_be_rejected: boolean;
  created_at: string;
  updated_at: string;
}

// IP Assignment History types
export interface IPAssignmentHistory {
  id: number;
  ip_address: number;
  ip_address_detail?: {
    id: number;
    address: string;
    status: string;
    status_display: string;
  } | null;
  action: "assigned" | "reassigned" | "released" | "status_changed" | "reserved" | "deprecated";
  action_display: string;
  assigned_to_asset?: number | null;
  assigned_to_asset_detail?: {
    id: number;
    name: string;
    asset_tag?: string | null;
  } | null;
  previous_asset?: number | null;
  previous_asset_detail?: {
    id: number;
    name: string;
    asset_tag?: string | null;
  } | null;
  previous_status?: string | null;
  new_status?: string | null;
  performed_by?: number | null;
  performed_by_detail?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  } | null;
  reason?: string | null;
  notes?: string | null;
  created_at: string;
}

// DHCP Types
export interface DHCPScope {
  id: number;
  subnet: number;
  subnet_detail?: Subnet;
  name: string;
  description?: string | null;
  start_ip: string;
  end_ip: string;
  subnet_mask: string;
  gateway?: string | null;
  dns_servers?: string | null;
  lease_duration: number;
  max_leases?: number | null;
  is_active: boolean;
  active_leases_count?: number;
  reservations_count?: number;
  available_ips?: number;
  created_at: string;
  updated_at: string;
}

export interface DHCPLease {
  id: number;
  scope: number;
  scope_detail?: {
    id: number;
    name: string;
    subnet?: string | null;
  };
  ip_address: string;
  mac_address: string;
  hostname?: string | null;
  status: "active" | "expired" | "released" | "declined";
  status_display: string;
  lease_start: string;
  lease_end: string;
  lease_renewal?: string | null;
  client_identifier?: string | null;
  vendor_class?: string | null;
  notes?: string | null;
  is_expired?: boolean;
  time_remaining?: number;
  created_at: string;
  updated_at: string;
}

export interface DHCPReservation {
  id: number;
  scope: number;
  ip_address: string;
  mac_address: string;
  hostname?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DHCPScopeAvailability {
  total_ips: number;
  max_leases: number;
  active_leases: number;
  reservations: number;
  available: number;
  utilization_percentage: number;
}

export interface DHCPLeaseStatistics {
  total_leases: number;
  active_leases: number;
  expired_leases: number;
  released_leases: number;
  scopes_count: number;
}

// IP Pool Types
export interface IPPool {
  id: number;
  subnet: number;
  subnet_detail?: Subnet;
  name: string;
  description?: string | null;
  start_ip: string;
  end_ip: string;
  reservation_policy: "none" | "percentage" | "fixed";
  reservation_policy_display: string;
  reserved_percentage: number;
  reserved_count: number;
  is_active: boolean;
  total_ips?: number;
  reserved_count?: number;
  available_count?: number;
  utilization_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface SubnetMaskInfo {
  bitmask: number;
  netmask: string;
  wildcard_mask: string;
  binary: string;
  subnets: number | string;
  hosts: number | string;
  subnet_bits: number;
  host_bits: number;
  is_ipv6?: boolean;
}

// Device Types
export interface DeviceType {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rack {
  id: number;
  name: string;
  location: number;
  location_detail?: {
    id: number;
    name: string;
    city: string;
  };
  description?: string | null;
  total_units: number;
  devices_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: number;
  name: string;
  ip_address?: string | null;
  device_type?: number | null;
  device_type_detail?: DeviceType;
  location?: number | null;
  location_detail?: {
    id: number;
    name: string;
    city: string;
  };
  rack?: number | null;
  rack_detail?: {
    id: number;
    name: string;
    location?: string | null;
  };
  rack_position?: number | null;
  rack_size?: number | null;
  description?: string | null;
  vendor?: string | null;
  model?: string | null;
  version?: string | null;
  switch_port?: "wired" | "wireless" | null;
  sections?: string[];
  is_active: boolean;
  hosts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface IPPoolUtilization {
  pool_id: number;
  pool_name: string;
  total_ips: number;
  used_ips: number;
  reserved_ips: number;
  available_ips: number;
  utilization_percentage: number;
}

// Subnet Utilization types
export interface SubnetUtilization {
  subnet_id: number;
  subnet_network: string;
  is_ipv6: boolean;
  total_hosts: number;
  usable_hosts: number;
  used_ips: number;
  available_ips: number;
  reserved_ips: number;
  assigned_ips: number;
  dhcp_ips: number;
  deprecated_ips: number;
  utilization_percentage: number;
  available_percentage: number;
  status: "critical" | "warning" | "moderate" | "healthy";
}

export interface SubnetCapacity extends SubnetUtilization {
  growth_rate: number;
  projection_months: number;
  projected_usage: Array<{
    month: number;
    projected_used: number;
    projected_available: number;
    projected_utilization: number;
  }>;
  months_until_full?: number | null;
  capacity_warning: boolean;
}

export interface UtilizationSummary {
  total_subnets: number;
  total_usable_hosts: number;
  total_used_ips: number;
  total_available_ips: number;
  overall_utilization_percentage: number;
  subnets_by_status: {
    critical: number;
    warning: number;
    moderate: number;
    healthy: number;
  };
  status: "critical" | "warning" | "moderate" | "healthy";
}

// Phone Number Range types
export interface PhoneNumberRange {
  id: number;
  location?: number | null;
  location_detail?: {
    id: number;
    name: string;
    address?: string | null;
  } | null;
  carrier?: string | null;
  trunk?: string | null;
  start_number: string;
  stop_number: string;
  notes?: string | null;
  number_count: number;
  created_at: string;
  updated_at: string;
}

// Re-export DTO types for convenience
export type {
  SubnetCreateUpdateDto,
  VlanCreateUpdateDto,
  VrfCreateUpdateDto,
  CustomerCreateUpdateDto,
  IPRequestCreateDto,
  IPRequestApproveRejectDto,
  IPAssignDto,
  IPReleaseDto,
  PaginatedResponse,
} from "./ipam/dto";


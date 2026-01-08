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

// Re-export DTO types for convenience
export type {
  SubnetCreateUpdateDto,
  VlanCreateUpdateDto,
  VrfCreateUpdateDto,
  CustomerCreateUpdateDto,
  PaginatedResponse,
} from "./ipam/dto";


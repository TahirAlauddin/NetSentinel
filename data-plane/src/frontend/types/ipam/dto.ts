/**
 * IPAM DTOs (Data Transfer Objects)
 * Types for creating and updating IPAM entities
 */

import { Subnet, VLAN, VRF, Customer } from "../ipam";

/**
 * DTO for creating/updating a Subnet
 */
export interface SubnetCreateUpdateDto {
  network: string;
  description?: string | null;
  group?: number | null;
  location: number;
  vlan?: number | null;
  vrf?: number | null;
  gateway_ip?: string | null;
  nameservers?: string | null;
  master_subnet?: number | null;
  customer?: number | null;
  status?: "planned" | "active" | "deprecated";
}

/**
 * DTO for creating/updating a VLAN
 */
export interface VlanCreateUpdateDto {
  vlan_id: number;
  name: string;
  description?: string | null;
  location: number;
}

/**
 * DTO for creating/updating a VRF
 */
export interface VrfCreateUpdateDto {
  name: string;
  rd?: string | null;
  description?: string | null;
  location?: number | null;
}

/**
 * DTO for creating/updating a Customer
 */
export interface CustomerCreateUpdateDto {
  name: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

/**
 * DTO for creating/updating a SubnetGroup
 */
export interface SubnetGroupCreateUpdateDto {
  name: string;
  description?: string | null;
}

/**
 * DTO for creating an IP Request
 */
export interface IPRequestCreateDto {
  subnet: number;
  requested_ip?: string | null;
  purpose: string;
  description?: string | null;
  reservation_expires_at?: string | null;
}

/**
 * DTO for approving/rejecting an IP Request
 */
export interface IPRequestApproveRejectDto {
  approval_notes?: string | null;
}

/**
 * DTO for assigning an IP address to an asset
 */
export interface IPAssignDto {
  asset_id: number;
  reason?: string | null;
  notes?: string | null;
}

/**
 * DTO for releasing an IP address
 */
export interface IPReleaseDto {
  reason?: string | null;
  notes?: string | null;
  new_status?: "available" | "reserved" | "deprecated";
}

/**
 * Response types for paginated lists
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


/**
 * Types for Phone Management (managed numbers and number blocks).
 */

/** Service types for managed phone numbers: Fax, IVR, Ring Group, Forwarder, Extension */
export const MANAGED_PHONE_SERVICE_TYPES = [
  { value: "fax", label: "Fax" },
  { value: "ivr", label: "IVR" },
  { value: "ring_group", label: "Ring Group" },
  { value: "forwarder", label: "Forwarder" },
  { value: "extension", label: "Extension" },
] as const;

export type ManagedPhoneServiceType =
  (typeof MANAGED_PHONE_SERVICE_TYPES)[number]["value"];

export interface ManagedPhoneNumberRecord {
  id: number;
  number: string;
  phone_number_value: string;
  location: number;
  location_name: string;
  assigned_user: number | null;
  assigned_user_name: string | null;
  name: string;
  extension_number: string | null;
  service_type: ManagedPhoneServiceType;
  service_type_display: string;
  did_enabled: boolean;
  did_external_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagedPhoneNumberCreateDto {
  number: string;
  location: number;
  assigned_user?: number | null;
  name: string;
  extension_number?: string | null;
  service_type: ManagedPhoneServiceType;
  did_enabled?: boolean;
  did_external_number?: string | null;
  notes?: string | null;
}

export interface ManagedPhoneNumberBlockRecord {
  id: number;
  location: number;
  location_name: string;
  name: string;
  start_number: string;
  end_number: string;
  is_static_assignment: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagedPhoneNumberBlockCreateDto {
  location: number;
  name: string;
  start_number: string;
  end_number: string;
  is_static_assignment?: boolean;
  notes?: string | null;
}

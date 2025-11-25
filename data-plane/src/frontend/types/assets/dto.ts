// ============================================================================
// Asset DTOs (Data Transfer Objects)
// ============================================================================
// These DTOs represent what the frontend sends to the backend for create/update operations.
// They only include fields that can be sent, and make fields optional where appropriate.

import { ComputerDetails, NetworkDetails, DisplayDetails, PhoneDetails, PeripheralDetails } from "./extensions";
import { AssetStatus } from "./fields";

type NullableString = string | null;
type NullableNumber = number | null;
type NullableDateString = string | null;

/**
 * Base DTO interface containing all optional asset fields
 * Shared between create and update DTOs to avoid duplication
 */
interface BaseAssetDto {
  // Basic fields
  name?: string;
  category?: number; // Category ID
  asset_tag?: NullableString;
  impact?: NullableNumber; // 1-3
  vendor?: NullableNumber; // Vendor ID
  notes?: NullableString;
  model?: NullableString;
  serial_number?: NullableString;
  status?: AssetStatus;
  purchase_date?: NullableDateString;
  assigned_to?: NullableNumber; // User ID
  location?: NullableNumber; // Location ID
  mac_address?: NullableString;
  ip_address?: NullableString;
  manufacturer?: NullableString;
  tags?: number[]; // Array of Tag IDs
  system_uuid?: NullableString;
  system_uptime?: NullableString; // Duration string
  in_current_state_since?: NullableDateString;
  expected_checkin_date?: NullableDateString;
  used_by?: NullableNumber; // User ID
  managed_by?: NullableNumber; // User ID
  departments?: number[]; // Array of Department IDs
  custom_lifecycle?: NullableNumber; // CustomLifecycle ID
  purchase_price?: NullableString; // Decimal as string
  replacement_cost?: NullableString; // Decimal as string
  salvage_value?: NullableString; // Decimal as string
  useful_life_years?: NullableNumber;
  approaching_eol_months?: NullableNumber;
  po_number?: NullableString;
  machine_serial_number?: NullableString;
  product_number?: NullableString;
  acquisition_date?: NullableDateString;
  warranty_expiration?: NullableDateString;
  installation_date?: NullableDateString;
  calendar_alerts?: boolean;

  // Extension details (optional nested objects)
  computer_details?: Partial<ComputerDetails> | null;
  network_details?: Partial<NetworkDetails> | null;
  display_details?: Partial<DisplayDetails> | null;
  phone_details?: Partial<PhoneDetails> | null;
  peripheral_details?: Partial<PeripheralDetails> | null;
}

/**
 * DTO for creating a new asset
 * Only required fields: name, category
 * All other fields are optional
 */
export interface AssetCreateDto extends BaseAssetDto {
  // Required fields for creation
  name: string;
  category: number; // Category ID
}

/**
 * DTO for updating an existing asset
 * All fields are optional (PATCH operation)
 */
export interface AssetUpdateDto extends BaseAssetDto {
  // All fields inherited from BaseAssetDto are already optional
}


export interface CalendarAlertCreateUpdateDto {
  id?: string;
  date?: NullableDateString;
  message?: NullableString;
  assigned_to?: NullableNumber;
}

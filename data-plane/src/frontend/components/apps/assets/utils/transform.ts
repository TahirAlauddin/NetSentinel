import { AssetCreateDto, AssetUpdateDto } from "@/types/assets/dto";
import { Asset } from "@/types/assets/asset";
import { CalendarAlertCreateUpdateDto } from "@/types/assets/dto";
import { CalendarAlert } from "@/types/assets/fields";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts an ID from various formats:
 * - Object with `id` property -> extracts and parses the id (handles string/number IDs)
 * - String -> parses as integer
 * - Number -> returns as-is
 * - null/undefined -> returns as-is
 */
function extractId(value: unknown): number | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }
  
  if (typeof value === "number") {
    return value;
  }
  
  if (typeof value === "string") {
    const id = parseInt(value, 10);
    return isNaN(id) ? null : id;
  }
  
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = value.id;
    // Handle both string and number IDs from objects
    if (typeof id === "number") {
      return id;
    }
    if (typeof id === "string") {
      const parsedId = parseInt(id, 10);
      return isNaN(parsedId) ? null : parsedId;
    }
    return null;
  }
  
  return null;
}

/**
 * Transforms a required ID field (like category).
 * Throws an error if the value cannot be converted to a valid ID.
 */
function transformRequiredIdField(
  value: unknown,
  fieldName: string
): number {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`);
  }
  
  const id = extractId(value);
  if (id === null || id === undefined) {
    throw new Error(`Invalid ${fieldName} ID`);
  }
  
  return id;
}

/**
 * Transforms an optional nullable ID field.
 * Preserves undefined for partial updates, converts null/empty to null.
 */
function transformOptionalIdField(
  value: unknown,
  preserveUndefined: boolean = false
): number | null | undefined {
  if (value === undefined) {
    return preserveUndefined ? undefined : null;
  }
  
  if (value === null) {
    return null;
  }
  
  return extractId(value) ?? null;
}

/**
 * Transforms an array of IDs from various formats.
 * Filters out null/undefined values.
 */
function transformIdArray(value: unknown): number[] {
  if (value === undefined || value === null) {
    return [];
  }
  
  if (!Array.isArray(value)) {
    return [];
  }
  
  return value
    .map((item: unknown) => extractId(item))
    .filter((id: number | null | undefined): id is number => id !== null && id !== undefined);
}

/**
 * Converts empty strings to null for specified fields.
 */
function convertEmptyStringsToNull(
  data: Record<string, unknown>,
  fields: string[]
): void {
  for (const field of fields) {
    if (data[field] === "") {
      data[field] = null;
    }
  }
}

/**
 * Removes undefined values from an object.
 */
function removeUndefinedValues(data: Record<string, unknown>): void {
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });
}

// ============================================================================
// Shared Transform Logic
// ============================================================================

/**
 * Shared transformation logic for both create and update.
 * Removes read-only fields and transforms ID fields.
 */
function applyCommonTransformations(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null) {
    throw new Error("Data must be an object");
  }
  const transformed: Record<string, unknown> = { ...(data as Record<string, unknown>) };

  // Remove read-only fields that shouldn't be sent
  delete transformed.id;
  delete transformed.created_at;
  delete transformed.updated_at;
  delete transformed.images;
  delete transformed.attachments;
  delete transformed.related_items;
  delete transformed.calendar_alerts;

  // Transform optional nullable ID fields
  // Vendor: preserve undefined for partial updates
  if (transformed.vendor !== undefined) {
    transformed.vendor = transformOptionalIdField(transformed.vendor, true);
  }

  // Location: convert undefined/null to null
  if (transformed.location !== undefined) {
    transformed.location = transformOptionalIdField(transformed.location, false);
  }

  // Custom lifecycle: convert undefined/null to null
  if (transformed.custom_lifecycle !== undefined) {
    transformed.custom_lifecycle = transformOptionalIdField(transformed.custom_lifecycle, false);
  }

  // User reference fields: convert undefined/null to null
  if (transformed.assigned_to !== undefined) {
    transformed.assigned_to = transformOptionalIdField(transformed.assigned_to, false);
  }

  if (transformed.used_by !== undefined) {
    transformed.used_by = transformOptionalIdField(transformed.used_by, false);
  }

  if (transformed.managed_by !== undefined) {
    transformed.managed_by = transformOptionalIdField(transformed.managed_by, false);
  }

  // Transform ID arrays
  transformed.tags = transformIdArray(transformed.tags);
  transformed.departments = transformIdArray(transformed.departments);

  // Convert empty strings to null for optional string fields
  const optionalStringFields = [
    "asset_tag",
    "notes",
    "mac_address",
    "ip_address",
    "manufacturer",
    "model",
    "serial_number",
    "purchase_date",
    "po_number",
    "machine_serial_number",
    "product_number",
    "acquisition_date",
    "warranty_expiration",
    "installation_date",
    "in_current_state_since",
    "expected_checkin_date",
    "system_uuid",
    "system_uptime",
    "purchase_price",
    "replacement_cost",
    "salvage_value",
  ];
  convertEmptyStringsToNull(transformed, optionalStringFields);

  return transformed;
}

// ============================================================================
// Main Transform Functions
// ============================================================================

/**
 * Transforms Asset to AssetCreateDto for creating a new asset.
 * Validates that required fields (name, category) are present.
 * Converts objects to IDs, handles string IDs, etc.
 */
export function transformToCreateDto(
  data: AssetCreateDto | Asset | Partial<Asset>
): AssetCreateDto {
  const transformed = applyCommonTransformations(data);

  // Validate and transform required fields for create
  if (!transformed.name || typeof transformed.name !== "string" || transformed.name.trim() === "") {
    throw new Error("Asset name is required");
  }

  if (transformed.category === undefined || transformed.category === null) {
    throw new Error("Asset category is required");
  }
  transformed.category = transformRequiredIdField(transformed.category, "category");

  // Remove undefined values to avoid sending them
  removeUndefinedValues(transformed);

  return transformed as unknown as AssetCreateDto;
}

/**
 * Transforms Asset to AssetUpdateDto for updating an existing asset.
 * All fields are optional (PATCH semantics).
 * Converts objects to IDs, handles string IDs, etc.
 */
export function transformToUpdateDto(
  data: AssetUpdateDto | Asset | Partial<Asset>
): AssetUpdateDto {
  const transformed = applyCommonTransformations(data) as Record<string, unknown>;

  // Transform category if provided (optional for updates)
  if (transformed.category !== undefined && transformed.category !== null) {
    transformed.category = transformRequiredIdField(transformed.category, "category");
  }

  // Remove undefined values to avoid sending them (PATCH semantics)
  removeUndefinedValues(transformed);

  return transformed as unknown as AssetUpdateDto;
}


export function transformToCalendarAlertCreateUpdateDto(
  data: CalendarAlert | Partial<CalendarAlert>
): CalendarAlertCreateUpdateDto {
  const transformed: CalendarAlertCreateUpdateDto = {
    id: data.id,
    date: data.date,
    message: data.message,
    assigned_to: data.assigned_to ? extractId(data.assigned_to) : undefined,
  };

  return transformed;
}
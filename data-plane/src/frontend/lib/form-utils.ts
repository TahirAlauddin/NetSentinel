/**
 * Shared form data helpers to avoid repeated (formData.get("x") as string)?.trim() patterns.
 * Single place for FormData → typed value extraction (DRY).
 */

/**
 * Get a string from FormData, trimmed. Returns empty string if missing; use allowEmpty: false and check for null for "required" semantics.
 */
export function getFormString(
  formData: FormData,
  key: string,
  options?: { default?: string; allowEmpty?: boolean }
): string {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  const defaultVal = options?.default ?? "";
  if (options?.allowEmpty === false && value === "") return defaultVal;
  return value || defaultVal;
}

/**
 * Get an optional string (trimmed or null if empty/missing). Use for optional fields that may be null in API.
 */
export function getFormStringOrNull(
  formData: FormData,
  key: string
): string | null {
  const raw = formData.get(key);
  if (raw == null) return null;
  const value = typeof raw === "string" ? raw.trim() : "";
  return value === "" ? null : value;
}

/**
 * Get a number from FormData. Returns NaN if missing or invalid.
 */
export function getFormNumber(formData: FormData, key: string): number {
  const raw = formData.get(key);
  if (raw == null || raw === "") return NaN;
  return Number(raw);
}

/**
 * Get an optional number (integer) from FormData. Returns null if missing or empty.
 */
export function getFormNumberOrNull(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/**
 * Get a boolean from FormData (e.g. checkbox "on" or hidden "true").
 */
export function getFormBoolean(formData: FormData, key: string): boolean {
  const raw = formData.get(key);
  return raw === "on" || raw === "true" || raw === "1";
}

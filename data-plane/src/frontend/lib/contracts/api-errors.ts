import { parseApiError } from "@/lib/api-client/error-parser";
import type { ContractFormErrors } from "./validation";

export interface ContractApiErrorResult {
  message: string;
  fieldErrors: Partial<ContractFormErrors>;
}

/**
 * Parse contract API error response into a single message and field-level errors
 * for use with setApiError and setFieldErrors in create/update flows.
 */
export function getContractApiError(response: {
  error?: string;
  errorData?: unknown;
}): ContractApiErrorResult {
  const parsed = parseApiError(response.errorData ?? response.error);
  const fieldErrors: Partial<ContractFormErrors> = {};
  if (parsed.fieldErrors) {
    for (const [k, v] of Object.entries(parsed.fieldErrors)) {
      const first = Array.isArray(v) ? v[0] : v;
      if (first) fieldErrors[k as keyof ContractFormErrors] = first;
    }
  }
  return {
    message: parsed.message,
    fieldErrors,
  };
}

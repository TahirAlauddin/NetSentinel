import type { ContractCreatePayload } from "@/types/contracts";

export interface ContractFormErrors {
  carrier?: string;
  contract_number?: string;
  date?: string;
  nrc?: string;
  mrc?: string;
  start_date?: string;
  end_date?: string;
}

function validateNumericField(
  value: string | number | null | undefined,
  fieldName: string,
  errors: ContractFormErrors,
  key: keyof ContractFormErrors
) {
  if (value !== undefined && value !== null && value !== "") {
    const n = Number(value);
    if (Number.isNaN(n) || n < 0) {
      errors[key] = `${fieldName} must be a non-negative number.`;
    }
  }
}

/**
 * Client-side validation for contract create/update. Returns an object of
 * field errors; empty object means valid.
 */
export function validateContractForm(
  payload: Partial<ContractCreatePayload>
): ContractFormErrors {
  const errors: ContractFormErrors = {};
  const carrier = payload.carrier?.trim();
  const contractNumber = payload.contract_number?.trim();

  if (!carrier) errors.carrier = "Carrier is required.";
  if (!contractNumber) errors.contract_number = "Contract number is required.";

  validateNumericField(payload.nrc, "NRC", errors, "nrc");
  validateNumericField(payload.mrc, "MRC", errors, "mrc");

  const startDate = payload.start_date?.trim();
  if (!startDate) errors.start_date = "Start date is required.";

  const contractType = payload.contract_type ?? "fixed_term";
  const endDate = payload.end_date?.trim();
  if (contractType === "fixed_term") {
    if (!endDate) errors.end_date = "End date is required for Fixed Term contracts.";
    else if (startDate && new Date(endDate) < new Date(startDate)) {
      errors.end_date = "End date must be on or after start date.";
    }
  }

  return errors;
}

export function hasContractFormErrors(errors: ContractFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Return a copy of field errors with the given keys removed.
 * Use when the user updates a field so its error can be cleared.
 */
export function clearContractFieldErrors(
  errors: ContractFormErrors,
  keys: ReadonlyArray<string>
): ContractFormErrors {
  const next = { ...errors };
  for (const key of keys) {
    delete next[key as keyof ContractFormErrors];
  }
  return next;
}

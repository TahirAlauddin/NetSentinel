import type {
  ContractCreatePayload,
  ContractUpdatePayload,
} from "@/types/contracts";

/**
 * Build FormData for contract create/update. Omits undefined; appends document
 * and logo only when they are File; sends empty string for null scalar fields.
 */
export function buildContractFormData(
  payload: ContractCreatePayload | ContractUpdatePayload
): FormData {
  const form = new FormData();
  const record = payload as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    if (key === "document" || key === "logo") {
      if (value instanceof File) form.append(key, value);
      continue;
    }
    if (value === null) {
      form.append(key, "");
      continue;
    }
    form.append(key, String(value));
  }
  return form;
}

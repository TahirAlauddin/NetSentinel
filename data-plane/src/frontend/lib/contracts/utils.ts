import type {
  ContractCreatePayload,
  ContractUpdatePayload,
} from "@/types/contracts";

/** Format a number or numeric string as USD. */
export function formatContractCurrency(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

/** Two-letter initials from carrier name (e.g. "AT&T" -> "AT", "Verizon" -> "VE"). */
export function contractCarrierInitials(carrier: string): string {
  const parts = carrier.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return carrier.slice(0, 2).toUpperCase() || "—";
}

/** Build full URL for document download (API may return relative path). */
export function contractDocumentUrl(path: string | null, baseUrl: string): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = baseUrl.replace(/\/api\/v1\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Normalize create payload: trim strings, coerce numbers, for API submit. */
export function normalizeContractCreatePayload(
  payload: ContractCreatePayload
): ContractCreatePayload {
  return {
    carrier: payload.carrier.trim(),
    contract_number: payload.contract_number.trim(),
    contract_type: payload.contract_type ?? "fixed_term",
    date: payload.date ?? null,
    nrc: payload.nrc === "" ? 0 : Number(payload.nrc),
    mrc: payload.mrc === "" ? 0 : Number(payload.mrc),
    start_date: payload.start_date,
    end_date: payload.end_date || null,
    document: payload.document ?? undefined,
    logo: payload.logo ?? undefined,
    category: payload.category ?? undefined,
  };
}

/** Normalize update payload: coerce numbers where present, for API submit. */
export function normalizeContractUpdatePayload(
  payload: ContractUpdatePayload
): ContractUpdatePayload {
  const next = { ...payload };
  if (payload.contract_type !== undefined) next.contract_type = payload.contract_type;
  if (payload.nrc !== undefined) next.nrc = payload.nrc === "" ? 0 : Number(payload.nrc);
  if (payload.mrc !== undefined) next.mrc = payload.mrc === "" ? 0 : Number(payload.mrc);
  if (payload.end_date !== undefined) next.end_date = payload.end_date || null;
  if (payload.logo !== undefined) next.logo = payload.logo ?? undefined;
  if (payload.category !== undefined) next.category = payload.category ?? undefined;
  return next;
}

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

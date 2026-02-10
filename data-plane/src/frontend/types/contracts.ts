/**
 * Contract types aligned with backend API (contracts app).
 * Backend: carrier, contract_number, date, nrc, mrc, start_date, end_date, document.
 */

/** Single contract as returned by the API */
export interface Contract {
  id: number;
  carrier: string;
  contract_number: string;
  date: string | null;
  nrc: string;
  mrc: string;
  start_date: string;
  end_date: string | null;
  document: string | null;
  logo: string | null;
  category: number | null;
  created_at: string;
  updated_at: string;
  /** Server-computed; only set when contract is expired or expiring in 0–90 days */
  expiry_label?: string | null;
  expiry_status?: "expired" | "expiring_30" | "expiring_60" | "expiring_90" | null;
}

/** Overview API response (at_glance, charts, categories) */
export interface ContractOverviewResponse {
  at_glance: {
    total: number;
    active: number;
    expired: number;
    expiring_30: number;
    expiring_60: number;
    expiring_90: number;
    monthly: number;
  };
  spending_by_category: Array<{ name: string; value: number; color: string }>;
  top_contracts: Array<{ name: string; value: number; color: string }>;
  categories: Array<{ name: string; count: number }>;
  total_spend: number;
}

/** Payload for creating a contract (document/logo optional; when any file present use FormData) */
export interface ContractCreatePayload {
  carrier: string;
  contract_number: string;
  date?: string | null;
  nrc?: number | string;
  mrc?: number | string;
  start_date: string;
  end_date?: string | null;
  document?: File | null;
  logo?: File | null;
  category?: number | null;
}

/** Payload for updating a contract (partial; document/logo optional) */
export interface ContractUpdatePayload {
  carrier?: string;
  contract_number?: string;
  date?: string | null;
  nrc?: number | string;
  mrc?: number | string;
  start_date?: string;
  end_date?: string | null;
  document?: File | null;
  logo?: File | null;
  category?: number | null;
}

/** Paginated list response from DRF */
export interface ContractListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contract[];
}

/** Validation limits for contract form (match backend validators) */
export const CONTRACT_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const CONTRACT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
] as const;
export const CONTRACT_ALLOWED_ACCEPT =
  ".pdf,.doc,.docx,.odt,.txt,.png,.jpg,.jpeg,.gif";

/** Logo: image-only, 2 MB max (match backend) */
export const CONTRACT_LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const CONTRACT_LOGO_ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
] as const;
export const CONTRACT_LOGO_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";

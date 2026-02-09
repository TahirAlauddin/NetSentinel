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
  created_at: string;
  updated_at: string;
}

/** Payload for creating a contract (document optional; when present use FormData) */
export interface ContractCreatePayload {
  carrier: string;
  contract_number: string;
  date?: string | null;
  nrc?: number | string;
  mrc?: number | string;
  start_date: string;
  end_date?: string | null;
  document?: File | null;
}

/** Payload for updating a contract (partial; document optional) */
export interface ContractUpdatePayload {
  carrier?: string;
  contract_number?: string;
  date?: string | null;
  nrc?: number | string;
  mrc?: number | string;
  start_date?: string;
  end_date?: string | null;
  document?: File | null;
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

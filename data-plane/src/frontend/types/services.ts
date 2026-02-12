/**
 * Types for telecom Services (business-facing; distinct from data circuits).
 */

export interface ServiceRecord {
  id: number;
  name: string;
  provider: number | null;
  provider_name: string | null;
  location: number | null;
  location_name: string | null;
  service_category: string | null;
  service_category_display: string | null;
  service_type: string | null;
  service_type_display: string | null;
  associated_product: string | null;
  account_number: string | null;
  security_code: string | null;
  contract_id: string | null;
  monthly_cost: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCreateDto {
  name: string;
  provider?: number | null;
  location?: number | null;
  service_category?: string | null;
  service_type?: string | null;
  associated_product?: string | null;
  account_number?: string | null;
  security_code?: string | null;
  contract_id?: string | null;
  monthly_cost?: string | null;
  notes?: string | null;
}

export type ServiceUpdateDto = ServiceCreateDto;

export interface ProviderRecord {
  id: number;
  name: string;
  description: string | null;
  service_type: string | null;
  service_type_display?: string | null;
  status: string;
  status_display?: string | null;
  account_number: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
  monthly_cost: string | null;
  notes: string | null;
  data_circuit_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderCreateDto {
  name: string;
  description?: string | null;
  service_type?: string | null;
  status?: string;
  account_number?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  monthly_cost?: string | null;
  notes?: string | null;
}

export type ProviderUpdateDto = ProviderCreateDto


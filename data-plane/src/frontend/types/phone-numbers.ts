/**
 * Types for Telecom Expense Management phone numbers.
 */

export interface PhoneNumberRecord {
  id: number;
  number: string;
  friendly_name: string | null;
  provider: number | null;
  provider_name: string | null;
  service: number | null;
  service_display: string | null;
  location: number | null;
  location_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhoneNumberCreateDto {
  number: string;
  friendly_name?: string | null;
  provider?: number | null;
  service?: number | null;
  location?: number | null;
  notes?: string | null;
}

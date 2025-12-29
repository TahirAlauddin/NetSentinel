export interface CarrierContactRecord {
  id: number;
  name: string;
  location: number | null;
  location_name?: string | null;
  customer_service_phone: string | null;
  technical_support_phone: string | null;
  sales_phone: string | null;
  billing_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CarrierContactCreateDto {
  name: string;
  location?: number | null;
  customer_service_phone?: string | null;
  technical_support_phone?: string | null;
  sales_phone?: string | null;
  billing_phone?: string | null;
}

export interface CarrierContactUpdateDto extends CarrierContactCreateDto {}


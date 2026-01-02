export interface DataCircuitRecord {
  id: number;
  provider: number | null;
  provider_name?: string | null;
  location: number | null;
  location_name?: string | null;
  circuit_id: string | null;
  alternate_cid: string | null;
  carrier: string | null;
  account_number: string | null;
  security_code: string | null;
  circuit_type: string | null;
  circuit_type_display?: string | null;
  line_speed: string | null;
  line_speed_display?: string | null;
  port_speed: string | null;
  handoff_type: string | null;
  handoff_type_display?: string | null;
  fiber_type: string | null;
  fiber_type_display?: string | null;
  connector_type: string | null;
  connector_type_display?: string | null;
  quote_id: string | null;
  contract_id: string | null;
  foc_date: string | null;
  ttu_date: string | null;
  monthly_cost: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataCircuitCreateDto {
  provider?: number | null;
  location?: number | null;
  circuit_id?: string | null;
  alternate_cid?: string | null;
  carrier?: string | null;
  account_number?: string | null;
  security_code?: string | null;
  circuit_type?: string | null;
  line_speed?: string | null;
  port_speed?: string | null;
  handoff_type?: string | null;
  fiber_type?: string | null;
  connector_type?: string | null;
  quote_id?: string | null;
  contract_id?: string | null;
  foc_date?: string | null;
  ttu_date?: string | null;
  monthly_cost?: string | null;
  notes?: string | null;
}

export type DataCircuitUpdateDto = DataCircuitCreateDto


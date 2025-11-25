// ============================================================================
// Extension Detail Interfaces
// ============================================================================

/**
 * Computer Details interface
 */
export interface ComputerDetails {
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  os: string;
  processor: string;
  memory: string;
  hard_drive: string;
  serial_number: string;
  product_model_number: string;
}

/**
 * Network Details interface
 */
export interface NetworkDetails {
  mac_address: string;
  ip_address: string;
  firmware: string;
  ports_count: number;
  throughput: string;
  ports: string;
  serial_number: string;
  product_model_number: string;
  sku: string;
  upc: string;
  mpn: string;
  cpn: string;
  ean: string;
  gtin: string;
}

/**
 * Display Details interface
 */
export interface DisplayDetails {
  size_inches: number;
  resolution: string;
  panel_type: string;
  refresh_rate: number;
}

/**
 * Phone Details interface
 */
export interface PhoneDetails {
  connection_interface: string;
  phone_type: string;
  extension: string;
  serial_number: string;
  product_model_number: string;
}

/**
 * Peripheral Details interface
 */
export interface PeripheralDetails {
  connection_type: string;
  peripheral_type: string;
  serial_number: string;
  product_model_number: string;
}

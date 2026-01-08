/**
 * Test fixtures for API responses
 * Provides consistent mock data for testing
 */

import type { Asset } from "@/types/assets";
import type { Category, Tag, CustomLifecycle } from "@/types/assets/fields";
import { UserRecord } from "@/types/users";
import { LocationRecord } from "@/types/locations";
import { DepartmentRecord } from "@/types/departments";
import {
  ComputerDetails,
  NetworkDetails,
  DisplayDetails,
  PhoneDetails,
  PeripheralDetails,
} from "@/types/assets/extensions";

export const mockUser: UserRecord = {
  id: "1",
  username: "testuser",
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
  is_staff: false,
  is_superuser: false,
  is_active: true,
  date_joined: "2024-01-01T00:00:00Z",
  last_login: "2024-01-01T00:00:00Z",
};

export const mockLocation: LocationRecord = {
  id: 1,
  name: "Test Location",
  alias: "test-location",
  address1: "123 Test St",
  address2: "",
  city: "Test City",
  state: "CA",
  zip_code: "12345",
  phone: "555-1234",
  longitude: -122.4194,
  latitude: 37.7749,
  type_building: "Office",
  mpoe: "MPOE-001",
  dmarc: "DMARC-001",
};

export const mockTag: Tag = {
  id: 1,
  name: "Test Tag",
  color: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockDepartment: DepartmentRecord = {
  id: 1,
  name: "Test Department",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockCustomLifecycle: CustomLifecycle = {
  id: 1,
  name: "Test Lifecycle",
  description: "Test Description",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockComputerDetails: ComputerDetails = {
  cpu: "Intel Core i7",
  ram: "16GB",
  storage: "512GB SSD",
  gpu: "NVIDIA RTX 3060",
  os: "Windows 11",
  processor: "Intel Core i7",
  memory: "16GB",
  hard_drive: "512GB SSD",
  serial_number: "COMP-001",
  product_model_number: "MODEL-001",
};

export const mockNetworkDetails: NetworkDetails = {
  mac_address: "00:11:22:33:44:55",
  ip_address: "192.168.1.1",
  firmware: "v1.0.0",
  ports_count: 8,
  throughput: "1Gbps",
  ports: "8x Gigabit",
  serial_number: "NET-001",
  product_model_number: "NET-MODEL-001",
  sku: "SKU-001",
  upc: "UPC-001",
  mpn: "MPN-001",
  cpn: "CPN-001",
  ean: "EAN-001",
  gtin: "GTIN-001",
};

export const mockDisplayDetails: DisplayDetails = {
  size_inches: 27,
  resolution: "2560x1440",
  panel_type: "IPS",
  refresh_rate: 144,
};

export const mockPhoneDetails: PhoneDetails = {
  connection_interface: "Ethernet",
  phone_type: "VoIP",
  extension: "123",
  serial_number: "PHONE-001",
  product_model_number: "PHONE-MODEL-001",
};

export const mockPeripheralDetails: PeripheralDetails = {
  connection_type: "USB",
  peripheral_type: "Keyboard",
  serial_number: "PERIPH-001",
  product_model_number: "PERIPH-MODEL-001",
};

export const mockAssetCategory: Category = {
  id: 1,
  name: "Test Category",
  tech_specs: {
    id: 1,
    name: "Test Tech Specs",
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  tech_specs_name: "Test Tech Specs",
};

export const mockAsset: Asset = {
  id: 1,
  name: "Test Asset",
  category: mockAssetCategory,
  asset_tag: "ASSET-001",
  impact: 1,
  vendor: null,
  notes: "Test Notes",
  model: "Test Model",
  serial_number: "1234567890",
  status: "active",
  purchase_date: "2024-01-01",
  assigned_to: mockUser,
  location: mockLocation,
  mac_address: "1234567890",
  ip_address: "192.168.1.1",
  manufacturer: "Test Manufacturer",
  tags: [mockTag],
  system_uuid: "1234567890",
  system_uptime: "1234567890",
  in_current_state_since: "2024-01-01T00:00:00Z",
  expected_checkin_date: "2024-01-01T00:00:00Z",
  used_by: mockUser,
  managed_by: mockUser,
  departments: [mockDepartment],
  custom_lifecycle: mockCustomLifecycle,
  purchase_price: "1000.00",
  replacement_cost: "1500.00",
  salvage_value: "500.00",
  useful_life_years: 5,
  approaching_eol_months: 3,
  po_number: "PO-001",
  machine_serial_number: "1234567890",
  product_number: "1234567890",
  acquisition_date: "2024-01-01",
  warranty_expiration: "2024-01-01",
  installation_date: "2024-01-01",
  calendar_alerts: [],
  images: [],
  attachments: [],
  related_items: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  computer_details: mockComputerDetails,
  network_details: mockNetworkDetails,
  display_details: mockDisplayDetails,
  phone_details: mockPhoneDetails,
  peripheral_details: mockPeripheralDetails,
};

export const mockAssetList: Asset[] = [
  mockAsset,
  {
    ...mockAsset,
    id: 2,
    name: "Test Asset 2",
    asset_tag: "ASSET-002",
  },
];

export const mockApiError = {
  detail: "An error occurred",
};

export const mockFieldErrors = {
  name: ["This field is required."],
  asset_tag: ["This field may not be blank."],
};

export const mockNonFieldErrors = {
  non_field_errors: ["End date must be after start date."],
};

export const mockValidationError = {
  ...mockFieldErrors,
  ...mockNonFieldErrors,
};

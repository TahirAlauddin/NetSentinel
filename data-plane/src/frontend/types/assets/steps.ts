// ============================================================================
// Step-Specific Form Data Types
// ============================================================================

import { UserRecord } from "../users";
import { Category, Vendor, Tag, CustomLifecycle, AssetImage, AssetAttachment, CalendarAlert } from "./fields";
import { LocationRecord } from "../locations";
import { DepartmentRecord } from "../departments";

/**
 * BasicDetailsStepFormData - Form data for the Basic Details step
 */
export interface BasicDetailsStepFormData {
  name: string;
  category: Category;
  asset_tag?: string;
  impact?: number;
  vendor?: Vendor | null;
  notes?: string | null;
}

/**
 * TechSpecsStepFormData - Form data for the Tech Specs step
 */
export interface TechSpecsStepFormData {
  mac_address?: string;
  ip_address?: string;
  manufacturer?: string;
  model?: string;
  tags?: Tag[];
}

/**
 * LocationAndUsageStepFormData - Form data for the Location & Usage step
 */
export interface LocationAndUsageStepFormData {
  in_current_state_since?: string;
  expected_checkin_date?: string;
  used_by?: UserRecord;
  managed_by?: UserRecord;
  location?: LocationRecord;
  departments?: DepartmentRecord[];
}

/**
 * CostDepreciationStepFormData - Form data for the Cost Depreciation step
 */
export interface CostDepreciationStepFormData {
  custom_lifecycle?: CustomLifecycle;
  purchase_price?: string;
  replacement_cost?: string;
  salvage_value?: string;
  useful_life_years?: number;
  approaching_eol_months?: number;
  po_number?: string;
}

/**
 * WarrantyAcquisitionStepFormData - Form data for the Warranty & Acquisition step
 */
export interface WarrantyAcquisitionStepFormData {
  machine_serial_number?: string;
  product_number?: string;
  acquisition_date?: string;
  warranty_expiration?: string;
  installation_date?: string;
}

/**
 * AlertsStepFormData - Form data for the Alerts step
 */
export interface AlertsStepFormData {
  calendar_alerts: CalendarAlert[];
  asset_id: number | string;
}

/**
 * AdditionalDetailsStepFormData - Form data for the Additional Details step
 */
export interface AdditionalDetailsStepFormData {
  images?: AssetImage[];
  attachments?: AssetAttachment[];
}

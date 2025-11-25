import { UserRecord } from "../users";

// ============================================================================
// Asset Fields Interfaces
// ============================================================================

export type AssetStatus = "active" | "retired" | "in_repair" | "disposed";

export type WarrantyStatus = "in_warranty" | "expiring_soon" | "expired" | "no_warranty";

/**
 * Asset image interface
 */
export interface AssetImage {
  id: number;
  image: string;
  created_at: string;
  updated_at: string;
}

/**
 * Asset attachment interface
 */
export interface AssetAttachment {
  id: number;
  file: string;
  created_at: string;
  updated_at: string;
}

/**
 * Tag interface
 */
export interface Tag {
  id: number;
  name: string;
  color?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Asset Category interface
 */
export interface Category {
  id: number;
  name: string;
  tech_specs: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  tech_specs_name: string;
}

/**
 * Custom Lifecycle interface
 */
export interface CustomLifecycle {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Vendor interface
 */
export interface Vendor {
  id: number;
  name: string;
  contact_info?: string | null;
  website?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calendar Alert - Individual alert entry
 */
export interface CalendarAlert {
  id?: string; // Temporary ID for React keys
  date?: string; // Date in YYYY-MM-DD format
  message?: string; // Alert message/description
  assigned_to?: UserRecord | null; // Assigned user
}

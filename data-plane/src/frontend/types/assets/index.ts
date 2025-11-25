import { UserRecord } from "@/types/users";
import { LocationRecord } from "@/types/locations";
import { DepartmentRecord } from "@/types/departments";
import {
  ComputerDetails,
  NetworkDetails,
  DisplayDetails,
  PhoneDetails,
  PeripheralDetails,
} from "./extensions";

/**
 * Asset types and interfaces for the NetSentinel application
 * Based on the backend Asset model structure
 */

// ============================================================================
// Statistics and Metrics Interfaces
// ============================================================================

/**
 * Asset metrics for dashboard display
 */
export interface AssetMetrics {
  total: number;
  active: number;
  retired: number;
  in_repair: number;
  disposed: number;
}

/**
 * Asset statistics response
 */
export interface AssetStats {
  total: number;
  active: number;
  retired: number;
  in_repair: number;
  disposed: number;
}

export * from "./asset";
export * from "./fields";
export * from "./extensions";
export * from "./steps";
export * from "./dto";


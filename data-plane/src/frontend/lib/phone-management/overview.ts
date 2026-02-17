import type {
  ManagedPhoneNumberRecord,
  ManagedPhoneNumberBlockRecord,
} from "@/types/phone-management";
import { MANAGED_PHONE_SERVICE_TYPES } from "@/types/phone-management";

export interface PhoneManagementAtGlance {
  total_numbers: number;
  total_blocks: number;
  unassigned: number;
  did_enabled: number;
  locations_with_numbers: number;
}

export interface ServiceTypeSlice {
  name: string;
  value: number;
  color: string;
}

export interface LocationBarItem {
  name: string;
  count: number;
  color: string;
}

export interface ServiceTypeCategory {
  name: string;
  count: number;
}

const PIE_COLORS = [
  "#2E7CF6", // blue
  "#16A085", // teal
  "#8B6FD9", // purple
  "#E67E22", // orange
  "#27AE60", // green
];

const BAR_COLOR = "#2E7CF6";

export function computePhoneManagementOverview(
  numbers: ManagedPhoneNumberRecord[],
  blocks: ManagedPhoneNumberBlockRecord[]
): {
  at_glance: PhoneManagementAtGlance;
  by_service_type: ServiceTypeSlice[];
  by_location: LocationBarItem[];
  service_type_categories: ServiceTypeCategory[];
} {
  const unassigned = numbers.filter((n) => n.assigned_user == null).length;
  const did_enabled = numbers.filter((n) => n.did_enabled).length;
  const locationNames = new Set(numbers.map((n) => n.location_name).filter(Boolean));

  const byServiceType = new Map<string, number>();
  for (const { label } of MANAGED_PHONE_SERVICE_TYPES) {
    byServiceType.set(label, 0);
  }
  for (const n of numbers) {
    const label = n.service_type_display || n.service_type || "Other";
    byServiceType.set(label, (byServiceType.get(label) ?? 0) + 1);
  }

  const by_location_map = new Map<string, number>();
  for (const n of numbers) {
    const loc = n.location_name?.trim() || "Unknown";
    by_location_map.set(loc, (by_location_map.get(loc) ?? 0) + 1);
  }

  const by_service_type: ServiceTypeSlice[] = Array.from(byServiceType.entries())
    .filter(([, value]) => value > 0)
    .map(([name, value], i) => ({
      name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  const by_location: LocationBarItem[] = Array.from(by_location_map.entries())
    .map(([name, count]) => ({ name, count, color: BAR_COLOR }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const service_type_categories: ServiceTypeCategory[] = Array.from(
    byServiceType.entries()
  )
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    at_glance: {
      total_numbers: numbers.length,
      total_blocks: blocks.length,
      unassigned,
      did_enabled,
      locations_with_numbers: locationNames.size,
    },
    by_service_type,
    by_location,
    service_type_categories,
  };
}

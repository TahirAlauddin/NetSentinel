/**
 * Shared helpers for Telecom Expense Management (listing, KPIs).
 * Use from server or client via TelecomApiClient.
 * Services are business-facing; data circuits are technical (separate).
 */

import type { ProviderRecord } from "@/types/providers";
import type { ServiceRecord } from "@/types/services";

export type ServiceCategory = "data" | "voice" | "consolidated";

export interface TelecomKpis {
  ipAddressCount: number;
  phoneNumberCount: number;
  voiceMonthly: number;
  dataMonthly: number;
  consolidatedMonthly: number;
  totalServices: number;
  byCategory: { data: number; voice: number; consolidated: number };
}

function parseCost(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function serviceCategory(category: string | null | undefined): ServiceCategory {
  if (!category) return "data";
  const t = category.toLowerCase();
  if (t === "voice") return "voice";
  if (t === "consolidated") return "consolidated";
  return "data";
}

/**
 * Compute KPIs from providers and services (business-facing).
 * IP/Phone counts are placeholders (0) unless we have a future source.
 */
export function computeTelecomKpis(
  providers: ProviderRecord[],
  services: ServiceRecord[]
): TelecomKpis {
  let voiceMonthly = 0;
  let dataMonthly = 0;
  let consolidatedMonthly = 0;
  let dataCount = 0;
  let voiceCount = 0;
  let consolidatedCount = 0;

  for (const p of providers) {
    const cost = parseCost(p.monthly_cost);
    const cat = serviceCategory(p.service_type);
    if (cat === "voice") {
      voiceMonthly += cost;
      voiceCount += 1;
    } else if (cat === "consolidated") {
      consolidatedMonthly += cost;
      consolidatedCount += 1;
    } else {
      dataMonthly += cost;
      dataCount += 1;
    }
  }

  for (const s of services) {
    const cost = parseCost(s.monthly_cost);
    const cat = serviceCategory(s.service_category);
    if (cat === "voice") {
      voiceMonthly += cost;
      voiceCount += 1;
    } else if (cat === "consolidated") {
      consolidatedMonthly += cost;
      consolidatedCount += 1;
    } else {
      dataMonthly += cost;
      dataCount += 1;
    }
  }

  return {
    ipAddressCount: 0,
    phoneNumberCount: 0,
    voiceMonthly,
    dataMonthly,
    consolidatedMonthly,
    totalServices: dataCount + voiceCount + consolidatedCount,
    byCategory: { data: dataCount, voice: voiceCount, consolidated: consolidatedCount },
  };
}

/**
 * Chart data for donut: Data, Voice, Consolidated counts.
 */
export function telecomDonutData(kpis: TelecomKpis): Array<{ name: string; value: number }> {
  const { byCategory } = kpis;
  const result: Array<{ name: string; value: number }> = [];
  if (byCategory.data > 0) result.push({ name: "Data", value: byCategory.data });
  if (byCategory.voice > 0) result.push({ name: "Voice", value: byCategory.voice });
  if (byCategory.consolidated > 0) result.push({ name: "Consolidated", value: byCategory.consolidated });
  return result.length > 0 ? result : [{ name: "No services", value: 1 }];
}

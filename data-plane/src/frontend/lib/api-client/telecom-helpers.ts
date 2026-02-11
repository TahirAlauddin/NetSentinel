/**
 * Shared helpers for Telecom Expense Management (listing, KPIs).
 * Use from server or client via TelecomApiClient.
 */

import type { ProviderRecord } from "@/types/providers";
import type { DataCircuitRecord } from "@/types/data-circuits";

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

function providerCategory(serviceType: string | null | undefined): ServiceCategory {
  if (!serviceType) return "data";
  const t = serviceType.toLowerCase();
  if (t === "voice") return "voice";
  if (t === "consolidated") return "consolidated";
  return "data"; // data, internet, mobile
}

/**
 * Compute KPIs from providers and data circuits.
 * IP/Phone counts are placeholders (0) unless we have a future source.
 */
export function computeTelecomKpis(
  providers: ProviderRecord[],
  circuits: DataCircuitRecord[]
): TelecomKpis {
  let voiceMonthly = 0;
  let dataMonthly = 0;
  let consolidatedMonthly = 0;
  let dataCount = 0;
  let voiceCount = 0;
  let consolidatedCount = 0;

  for (const p of providers) {
    const cost = parseCost(p.monthly_cost);
    const cat = providerCategory(p.service_type);
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

  for (const c of circuits) {
    dataMonthly += parseCost(c.monthly_cost);
    dataCount += 1;
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

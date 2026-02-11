import type { ContractOverviewResponse } from "@/types/contracts";

/** Labels and styling for at-a-glance overview cards. */
export const AT_GLANCE_LABELS: Array<{
  key: keyof ContractOverviewResponse["at_glance"];
  label: string;
  color: string;
}> = [
  { key: "total", label: "Total", color: "text-gray-900" },
  { key: "active", label: "Active", color: "text-green-600" },
  { key: "expired", label: "Expired", color: "text-gray-400" },
  { key: "expiring_30", label: "Expiring < 30 days", color: "text-gray-400" },
  { key: "expiring_60", label: "Expiring < 60 days", color: "text-blue-600" },
  { key: "expiring_90", label: "Expiring < 90 days", color: "text-blue-600" },
  { key: "monthly", label: "Monthly", color: "text-gray-400" },
];

/** Default overview state before API load. */
export const DEFAULT_CONTRACT_OVERVIEW: ContractOverviewResponse = {
  at_glance: {
    total: 0,
    active: 0,
    expired: 0,
    expiring_30: 0,
    expiring_60: 0,
    expiring_90: 0,
    monthly: 0,
  },
  spending_by_category: [],
  top_contracts: [],
  categories: [],
  total_spend: 0,
};

/** Shared input className for contract forms (new + edit). */
export const CONTRACT_INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

/** Shared label className for contract forms. */
export const CONTRACT_LABEL_CLASS = "block text-sm font-medium text-gray-900 mb-2";

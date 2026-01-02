// ==================== Constants ====================

import { WarrantyStatus } from "@/types/assets";
import { AlertTriangle, CheckCircle2, CircleArrowRight, XCircle } from "lucide-react";

/**
 * Warranty status color mapping
 */
export const WARRANTY_COLORS: Record<WarrantyStatus, string> = {
  in_warranty: "#06b6d4",
  expiring_soon: "#f97316",
  expired: "#dc2626",
  no_warranty: "#6b7280",
};

/**
 * Constants for Managed Asset Form
 */

export const DEVICE_TYPES = [
  "Apple Device",
  "Desktop",
  "Dongle",
  "Firewall",
  "iPad",
  "iPhone",
  "Laptop",
  "Mobile",
  "Other",
  "Phone",
  "Phone System",
  "Printer",
  "Router",
  "Server",
  "Switch",
  "Tablet",
  "Thin Client",
  "TV",
  "Unrecognized",
  "Virtual Machine",
  "WAP",
  "Windows",
] as const;

export const IMPACT_LEVELS = {
  1: "bg-blue-600 border-blue-600 text-white",
  2: "bg-yellow-600 border-yellow-600 text-white",
  3: "bg-red-600 border-red-600 text-white",
} as const;

export const STEPS = [
  { id: "basic", label: "Basic Details", icon: null },
  { id: "tech-specs", label: "Tech Specs", icon: null },
  { id: "location", label: "Location & Usage", icon: null },
  { id: "cost", label: "Cost Depreciation", icon: null },
  { id: "warranty", label: "Warranty & Acquisition", icon: null },
  { id: "alerts", label: "Alerts", icon: null },
  { id: "additional", label: "Additional Details", icon: null },
] as const;

/**
 * Predefined colors for asset tags (round-robin selection)
 */
export const TAG_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
] as const;

/**
 * Maximum number of tags allowed per asset
 */
export const MAX_TAGS_PER_ASSET = 5;

/**
 * Status options for asset status
 */
export const STATUS_OPTIONS = [
  {
    value: "in_use",
    label: "In Use",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  {
    value: "ready_to_use",
    label: "Ready to Use",
    icon: CircleArrowRight,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    value: "needs_attention",
    label: "Needs Attention",
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
  },
  {
    value: "unusable",
    label: "Unusable",
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
];

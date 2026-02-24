import type { PhoneManagementAtGlance } from "@/lib/phone-management/overview";

export const AT_GLANCE_LABELS: Array<{
  key: keyof PhoneManagementAtGlance;
  label: string;
  color: string;
}> = [
  { key: "total_numbers", label: "Managed numbers", color: "text-foreground" },
  { key: "total_blocks", label: "Number blocks", color: "text-foreground" },
  { key: "unassigned", label: "Unassigned", color: "text-muted-foreground" },
  { key: "did_enabled", label: "DID enabled", color: "text-primary" },
  {
    key: "locations_with_numbers",
    label: "Locations",
    color: "text-muted-foreground",
  },
];

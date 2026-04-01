import { PermissionRecord } from "@/types/groups";

export type AppKey =
  | "all"
  | "assets"
  | "contracts"
  | "ipam"
  | "telecom"
  | "phone_mgmt"
  | "users";

export type AccessLevel = "none" | "read" | "edit" | "admin";
export type AppAccessSelection = Record<Exclude<AppKey, "all">, AccessLevel>;

export const APP_LABELS: Record<AppKey, string> = {
  all: "All",
  assets: "Assets",
  contracts: "Contracts",
  ipam: "IPAM",
  telecom: "Telecom",
  phone_mgmt: "Phone Mgmt",
  users: "Users",
};

export const APP_ORDER: AppKey[] = [
  "all",
  "assets",
  "contracts",
  "ipam",
  "telecom",
  "phone_mgmt",
  "users",
];

/**
 * This function is used to build an empty app access selection.
 * It is used to initialize the app access selection when a new group is created.
 */
export function buildEmptyAppAccess(): AppAccessSelection {
  const next = {} as AppAccessSelection;
  for (const app of APP_ORDER) {
    if (app !== "all") next[app as Exclude<AppKey, "all">] = "none";
  }
  return next;
}

export const VERB_PREFIXES = new Set(["view", "add", "change", "delete"]);
export const BOTTOM_THRESHOLD_PX = 72;
export const SEARCH_DEBOUNCE_MS = 450;

const ASSET_KEYWORDS = [
  "asset",
  "inventory",
  "computerdetails",
  "networkdetails",
  "displaydetails",
  "phonedetails",
  "peripheraldetails",
  "calendar_alert",
  "tech specs",
  "tech_specs",
];

function includesAny(source: string, needles: string[]) {
  return needles.some((needle) => source.includes(needle));
}

export function getAppKey(permission: PermissionRecord): AppKey {
  /**
   * Heuristic mapping from Django permission metadata to UI app buckets.
   * Unknown entries intentionally fall back to the users bucket.
   */
  const codename = permission.codename.toLowerCase();
  const name = permission.name.toLowerCase();
  const source = `${codename} ${name}`;

  if (source.includes("contract")) return "contracts";

  if (
    includesAny(source, [
      "dhcp",
      "subnet",
      "vlan",
      "vrf",
      "ipam",
      "ip_pool",
      "ip pool",
      "ip address",
    ])
  ) {
    return "ipam";
  }

  if (
    includesAny(source, [
      "telecom",
      "provider",
      "circuit",
      "carrier",
      "trunk",
      "service",
    ])
  ) {
    return "telecom";
  }

  if (includesAny(source, ["phone", "extension", "dial", "block"])) {
    return "phone_mgmt";
  }

  if (includesAny(source, ASSET_KEYWORDS)) {
    return "assets";
  }

  // Default unknown permissions into Users instead of a separate "Other" tab.
  return "users";
}


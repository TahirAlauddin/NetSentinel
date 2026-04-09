/**
 * Hard-coded mapping from Django models to default permission codenames.
 *
 * Django uses `Meta.model_name` (lowercase) for default CRUD codenames:
 *   view_<model>, add_<model>, change_<model>, delete_<model>
 *
 * Used by AppAccessLevelSelect (groups/new, etc.):
 *   - Read All  → every `view_*` codename that matches a listed model stem (plus asset-report extras).
 *   - Edit All  → those `view_*` plus matching `change_*` only (no add_/delete_).
 *   - Admin     → all permissions in that UI app bucket (including add_/delete_/unlisted codenames).
 */

import type { AppKey } from "@/constants/permissions-by-app";

/** `app_label` from Django — for documentation / maintenance only. */
export const DJANGO_APP_MODEL_STEMS = {
  /** assets/models/__init__.py + computer, display, network, peripheral, phone */
  assets: [
    "assettag",
    "customlifecycle",
    "vendor",
    "assetcategory",
    "asset",
    "calendaralert",
    "assetimage",
    "assetattachment",
    "assetrelation",
    "techspecs",
    "assetreport",
    "computerdetails",
    "networkdetails",
    "displaydetails",
    "phonedetails",
    "peripheraldetails",
  ] as const,

  /** contracts/models.py */
  contracts: ["contractcategory", "contract"] as const,

  /** ipam/models/* */
  ipam: [
    "subnetgroup",
    "subnet",
    "vlan",
    "vrf",
    "dnszone",
    "dnsrecord",
    "ipaddress",
    "customer",
    "iprequest",
    "ipassignmenthistory",
    "favoritesubnet",
    "networkscan",
    "scanresult",
    "phonenumberrange",
    "dhcpscope",
    "dhcplease",
    "dhcpreservation",
    "dhcpoption",
    "ippool",
    "devicetype",
    "rack",
    "device",
    "iptag",
    "ipaddresstag",
    "ipauditlog",
    "ipauditlogfilter",
    "ipnote",
    "ipnoteattachment",
    "ipnotecomment",
    "subnetthreshold",
    "subnetthresholdalert",
  ] as const,

  /** telecom/models.py */
  telecom: ["provider", "service", "datacircuit", "phonenumber"] as const,

  /** phone_management/models.py */
  phone_management: ["managedphonenumber", "managedphonenumberblock"] as const,

  /** users/models.py */
  users: ["user", "permissionbundle", "extendedgroup"] as const,

  /** infrastructure/models.py */
  infrastructure: [
    "location",
    "circuit",
    "pointofcontact",
    "department",
    "category",
    "contact",
    "carriercontact",
    "utilitycontact",
  ] as const,

  /** notifications/models.py */
  notifications: ["notificationconfig", "inappnotification", "notificationreadreceipt"] as const,

  /** django.contrib.auth (Group, Permission) */
  auth: ["group", "permission"] as const,
} as const;


/** Union of model stems per sidebar / AppAccessLevelSelect bucket (`AppKey`). */
export const FRONTEND_APP_MODEL_STEMS: Record<AppKey, readonly string[]> = {
  all: [],
  assets: [...DJANGO_APP_MODEL_STEMS.assets],
  contracts: [...DJANGO_APP_MODEL_STEMS.contracts],
  ipam: [...DJANGO_APP_MODEL_STEMS.ipam],
  telecom: [...DJANGO_APP_MODEL_STEMS.telecom],
  phone_mgmt: [...DJANGO_APP_MODEL_STEMS.phone_management],
  users: [
    ...DJANGO_APP_MODEL_STEMS.users,
    ...DJANGO_APP_MODEL_STEMS.infrastructure,
    ...DJANGO_APP_MODEL_STEMS.notifications,
    ...DJANGO_APP_MODEL_STEMS.auth,
  ],
};

export type CatalogAccessTier = "read" | "edit" | "admin";

/**
 * Classify a permission codename for a given UI app (must match getAppKey() bucketing).
 *
 * - read:  catalog `view_*` only (including AssetReport custom view_* list).
 * - edit:  catalog `change_*` (paired with Read All = view + change for known models).
 * - admin: add_*, delete_*, and any codename not covered above (still under this app in UI).
 */
export function getCatalogAccessTier(codename: string, frontendApp: AppKey): CatalogAccessTier {
  const c = codename.toLowerCase();
  const stems = FRONTEND_APP_MODEL_STEMS[frontendApp];
  if (!stems?.length) return "admin"; 

  for (const stem of stems) {
    if (c === `view_${stem}`) return "read";
    if (c === `change_${stem}`) return "edit";
    if (c === `add_${stem}` || c === `delete_${stem}`) return "admin";
  }

  return "admin";
}

"use client";

import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

export type AppLayoutKey =
  | "assets"
  | "phone-management"
  | "ipam"
  | "telecom-management"
  | "contracts"
  | "notifications"
  | "monitoring";

type Rule = {
  match: (pathname: string) => boolean;
  permission: string;
};

function resolveWithRules(pathname: string, rules: Rule[] | undefined): string | undefined {
  for (const rule of rules ?? []) {
    if (rule.match(pathname)) return rule.permission;
  }
  return undefined;
}

const assetsRules: Rule[] = [
  { match: (p) => p.startsWith("/assets/new"), permission: "assets.add_asset" },
  { match: (p) => p.startsWith("/assets/edit/"), permission: "assets.change_asset" },
];

const phoneManagementRules: Rule[] = [
  {
    match: (p) => p.startsWith("/phone-management/numbers/new"),
    permission: "phone_management.add_managedphonenumber",
  },
  {
    match: (p) => p.includes("/phone-management/numbers/") && p.endsWith("/edit"),
    permission: "phone_management.change_managedphonenumber",
  },
  {
    match: (p) => p.startsWith("/phone-management/blocks/new"),
    permission: "phone_management.add_phonenumberblock",
  },
  {
    match: (p) => p.includes("/phone-management/blocks/") && p.endsWith("/edit"),
    permission: "phone_management.change_managedphonenumberblock",
  },
];

const ipamRules: Rule[] = [
  { match: (p) => p.startsWith("/ipam/subnets/new"), permission: "ipam.add_subnet" },
  { match: (p) => p.startsWith("/ipam/subnets/edit/"), permission: "ipam.change_subnet" },
  {
    match: (p) => p.startsWith("/ipam/subnet-groups/new"),
    permission: "ipam.add_subnetgroup",
  },
  {
    match: (p) => p.startsWith("/ipam/subnet-groups/edit/"),
    permission: "ipam.change_subnetgroup",
  },
  { match: (p) => p.startsWith("/ipam/customers/new"), permission: "ipam.add_customer" },
  { match: (p) => p.startsWith("/ipam/customers/edit/"), permission: "ipam.change_customer" },
  { match: (p) => p.startsWith("/ipam/vlans/new"), permission: "ipam.add_vlan" },
  { match: (p) => p.startsWith("/ipam/vlans/edit/"), permission: "ipam.change_vlan" },
  { match: (p) => p.startsWith("/ipam/vrfs/new"), permission: "ipam.add_vrf" },
  { match: (p) => p.startsWith("/ipam/vrfs/edit/"), permission: "ipam.change_vrf" },
  { match: (p) => p.startsWith("/ipam/devices/new"), permission: "ipam.add_device" },
  { match: (p) => p.startsWith("/ipam/devices/edit/"), permission: "ipam.change_device" },
  {
    match: (p) => p.startsWith("/ipam/dhcp-scopes/new"),
    permission: "ipam.add_dhcpscope",
  },
  {
    match: (p) => p.startsWith("/ipam/dhcp-scopes/edit/"),
    permission: "ipam.change_dhcpscope",
  },
  { match: (p) => p.startsWith("/ipam/dhcp-leases/new"), permission: "ipam.add_dhcplease" },
  {
    match: (p) => p.startsWith("/ipam/dhcp-reservations/new"),
    permission: "ipam.add_dhcpreservation",
  },
  {
    match: (p) => p.startsWith("/ipam/dhcp-reservations/edit/"),
    permission: "ipam.change_dhcpreservation",
  },
  { match: (p) => p.startsWith("/ipam/ip-pools/new"), permission: "ipam.add_ippool" },
  { match: (p) => p.startsWith("/ipam/ip-pools/edit/"), permission: "ipam.change_ippool" },
];

const telecomRules: Rule[] = [
  {
    match: (p) => p.startsWith("/telecom-management/providers/new"),
    permission: "telecom.add_provider",
  },
  {
    match: (p) => p.includes("/telecom-management/providers/") && p.endsWith("/edit"),
    permission: "telecom.change_provider",
  },
  {
    match: (p) => p.startsWith("/telecom-management/services/new"),
    permission: "telecom.add_service",
  },
  {
    match: (p) => p.includes("/telecom-management/services/") && p.endsWith("/edit"),
    permission: "telecom.change_service",
  },
  {
    match: (p) => p.startsWith("/telecom-management/phone-numbers/new"),
    permission: "telecom.add_phonenumber",
  },
  {
    match: (p) => p.startsWith("/telecom-management/data-circuits/new"),
    permission: "telecom.add_datacircuit",
  },
];

const contractsRules: Rule[] = [
  { match: (p) => p.startsWith("/contracts/new"), permission: "contracts.add_contract" },
  { match: (p) => p.startsWith("/contracts/edit/"), permission: "contracts.change_contract" },
];

const monitoringRules: Rule[] = [
  { match: (p) => p.startsWith("/monitoring/dashboard/widgets/add"), permission: "monitoring.add_host" },
  { match: (p) => p.startsWith("/monitoring/hosts/add"), permission: "monitoring.add_host" },
  {
    match: (p) => p.includes("/monitoring/hosts/") && p.endsWith("/edit"),
    permission: "monitoring.change_host",
  },
  { match: (p) => p.startsWith("/monitoring/host-groups"), permission: "monitoring.view_host" },
  { match: (p) => p.startsWith("/monitoring/templates"), permission: "monitoring.view_host" },
  { match: (p) => p.startsWith("/monitoring/triggers"), permission: "monitoring.view_host" },
  { match: (p) => p.startsWith("/monitoring/problems"), permission: "monitoring.view_host" },
  { match: (p) => p.startsWith("/monitoring/events"), permission: "monitoring.view_host" },
  { match: (p) => p.startsWith("/monitoring/actions"), permission: "monitoring.view_host" },
];

export function getLayoutRequiredPermission(
  app: AppLayoutKey,
  pathname: string
): string | undefined {
  const p = pathname || "";
  const rulesByApp: Record<AppLayoutKey, Rule[]> = {
    assets: assetsRules,
    "phone-management": phoneManagementRules,
    ipam: ipamRules,
    "telecom-management": telecomRules,
    contracts: contractsRules,
    notifications: [],
    monitoring: monitoringRules,
  };
  return resolveWithRules(p, rulesByApp[app]) ?? getRequiredPermissionForPathname(p);
}

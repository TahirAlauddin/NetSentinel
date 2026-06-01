export const ROUTE_PERMISSIONS: Record<string, string> = {
  // Assets
  "/assets": "assets.view_asset",
  "/assets/list": "assets.view_asset",
  "/assets/reporting": "assets.view_asset",

  // Contracts
  "/contracts": "contracts.view_contract",

  // Telecom Management
  "/telecom-management": "telecom.view_provider",
  "/telecom-management/providers": "telecom.view_provider",
  "/telecom-management/services": "telecom.view_service",
  "/telecom-management/phone-numbers": "telecom.view_phonenumber",
  "/telecom-management/data-circuits": "telecom.view_datacircuit",

  // Notifications
  "/notifications": "notifications.view_inappnotification",
  "/notifications/email": "notifications.view_inappnotification",
  "/notifications/slack": "notifications.view_inappnotification",
  "/notifications/discord": "notifications.view_inappnotification",
  "/notifications/sms": "notifications.view_inappnotification",
  "/notifications/preferences": "notifications.view_inappnotification",

  // Phone Management
  "/phone-management": "phone_management.view_managedphonenumber",
  "/phone-management/numbers": "phone_management.view_managedphonenumber",
  "/phone-management/blocks": "phone_management.view_managedphonenumberblock",

  // IPAM
  "/ipam": "ipam.view_subnet",
  "/ipam/subnets": "ipam.view_subnet",
  "/ipam/subnet-groups": "ipam.view_subnetgroup",
  "/ipam/customers": "ipam.view_customer",
  "/ipam/vlans": "ipam.view_vlan",
  "/ipam/vrfs": "ipam.view_vrf",
  "/ipam/devices": "ipam.view_device",
  "/ipam/ip-requests": "ipam.view_subnet",
  "/ipam/favourite-subnets": "ipam.view_subnet",
  "/ipam/subnet-masks": "ipam.view_subnet",
  "/ipam/temporary-shares": "ipam.view_subnet",
  "/ipam/inactive-hosts": "ipam.view_subnet",
  "/ipam/duplicates": "ipam.view_subnet",
  "/ipam/thresholds": "ipam.view_subnet",
  "/ipam/ip-tags": "ipam.view_subnet",
  "/ipam/audit-logs": "ipam.view_subnet",
  "/ipam/dhcp-scopes": "ipam.view_dhcpscope",
  "/ipam/dhcp-leases": "ipam.view_dhcplease",
  "/ipam/dhcp-reservations": "ipam.view_dhcpreservation",
  "/ipam/ip-pools": "ipam.view_ippool",
  "/ipam/nat": "ipam.view_subnet",
  "/ipam/routing": "ipam.view_subnet",
  "/ipam/firewall-zones": "ipam.view_subnet",
  "/ipam/racks": "ipam.view_subnet",
  "/ipam/circuits": "ipam.view_subnet",
  "/ipam/locations": "ipam.view_subnet",
  "/ipam/search": "ipam.view_subnet",
  "/ipam/documentation": "ipam.view_subnet",

  // Monitoring
  "/monitoring": "monitoring.view_host",
  "/monitoring/dashboard": "monitoring.view_host",
  "/monitoring/dashboard/widgets/add": "monitoring.add_host",
  "/monitoring/hosts": "monitoring.view_host",
  "/monitoring/hosts/add": "monitoring.add_host",
  "/monitoring/host-groups": "monitoring.view_host",
  "/monitoring/templates": "monitoring.view_host",
  "/monitoring/triggers": "monitoring.view_host",
  "/monitoring/problems": "monitoring.view_host",
  "/monitoring/events": "monitoring.view_host",
  "/monitoring/actions": "monitoring.view_host",

  // Settings
  "/settings": "users.view_user",
  "/settings/locations": "users.view_user",
  "/settings/departments": "users.view_user",
  "/settings/categories": "users.view_user",
  "/settings/people": "users.view_user",
  "/settings/groups": "users.view_group",
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * Returns the permission required for this route, using exact match first,
 * then longest prefix match so nested routes inherit parent permissions.
 */
export function getRequiredPermissionForPathname(pathname: string): string | undefined {
  const normalizedPathname = normalizePathname(pathname);

  if (ROUTE_PERMISSIONS[normalizedPathname]) {
    return ROUTE_PERMISSIONS[normalizedPathname];
  }

  const matchedPrefix = Object.keys(ROUTE_PERMISSIONS)
    .filter((routePrefix) => {
      const normalizedRoutePrefix = normalizePathname(routePrefix);
      return (
        normalizedRoutePrefix !== "/" &&
        (normalizedPathname === normalizedRoutePrefix ||
          normalizedPathname.startsWith(`${normalizedRoutePrefix}/`))
      );
    })
    .sort((a, b) => b.length - a.length)[0];

  return matchedPrefix ? ROUTE_PERMISSIONS[matchedPrefix] : undefined;
}

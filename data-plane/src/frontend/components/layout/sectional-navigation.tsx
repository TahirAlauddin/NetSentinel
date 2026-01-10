"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Primary IPAM Navigation Items
 * Most commonly used pages shown prominently
 */
const PRIMARY_NAV_ITEMS = [
  { href: "/ipam", label: "Dashboard" },
  { href: "/ipam/subnets", label: "Subnets" },
  { href: "/ipam/subnet-groups", label: "Subnet Groups" },
  { href: "/ipam/customers", label: "Customers" },
  { href: "/ipam/vlans", label: "VLAN" },
  { href: "/ipam/vrfs", label: "VRF" },
  { href: "/ipam/devices", label: "Devices" },
  { href: "/ipam/ip-requests", label: "IP Requests" },
];

/**
 * Secondary IPAM Navigation Items
 * Organized by category for the dropdown menu
 */
const SECONDARY_NAV_ITEMS = {
  "Subnet Management": [
    { href: "/ipam/favourite-subnets", label: "Favourite Subnets" },
    { href: "/ipam/scanned-networks", label: "Scanned Networks" },
    { href: "/ipam/subnet-masks", label: "Subnet Masks" },
    { href: "/ipam/temporary-shares", label: "Temporary Shares" },
    { href: "/ipam/inactive-hosts", label: "Inactive Hosts" },
    { href: "/ipam/duplicates", label: "Duplicates" },
    { href: "/ipam/threshold", label: "Threshold" },
  ],
  "Network Services": [
    { href: "/ipam/nat", label: "NAT" },
    { href: "/ipam/routing", label: "Routing" },
    { href: "/ipam/firewall-zones", label: "Firewall Zones" },
  ],
  "Infrastructure": [
    { href: "/ipam/racks", label: "Racks" },
    { href: "/ipam/circuits", label: "Circuits" },
    { href: "/ipam/locations", label: "Locations" },
  ],
  "Tools": [
    { href: "/ipam/search", label: "IP Search" },
    { href: "/ipam/documentation", label: "Documentation" },
  ],
};

/**
 * Settings Navigation Items
 */
const SETTINGS_NAV_ITEMS = [
  { href: "/settings", label: "Overview" },
  { href: "/settings/people", label: "People" },
  { href: "/settings/groups", label: "Groups & Permissions" },
  { href: "/settings/locations", label: "Locations" },
  { href: "/settings/categories", label: "Categories" },
  { href: "/settings/departments", label: "Departments" },
  { href: "/settings/carrier-contacts", label: "Carrier Contacts" },
];

/**
 * Sectional Navigation Component
 * Displays contextual navigation items based on the current route.
 * Shows IPAM navigation when on IPAM routes, Settings navigation when on Settings routes,
 * otherwise shows default navigation.
 */
export function SectionalNavigation() {
  const pathname = usePathname();
  const isIpamRoute = pathname.startsWith("/ipam");
  const isSettingsRoute = pathname.startsWith("/settings");

  // Show IPAM navigation when on IPAM routes
  if (isIpamRoute) {
    return <IpamNavigation pathname={pathname} />;
  }

  // Show Settings navigation when on Settings routes
  if (isSettingsRoute) {
    return <SettingsNavigation pathname={pathname} />;
  }

  // Default navigation for other routes
  return <DefaultNavigation />;
}

/**
 * IPAM Navigation Component
 * Shows primary items prominently and organizes secondary items in a dropdown
 */
function IpamNavigation({ pathname }: { pathname: string }) {
  const isActive = (href: string) => {
    if (href === "/ipam") {
      return pathname === "/ipam";
    }
    return pathname.startsWith(href);
  };

  // Check if any secondary item is active
  const isSecondaryActive = Object.values(SECONDARY_NAV_ITEMS)
    .flat()
    .some((item) => isActive(item.href));

  return (
    <ul className="flex items-center gap-2 sm:gap-4 lg:gap-6 py-2 sm:py-3 text-xs sm:text-sm overflow-x-auto">
      {/* Primary navigation items */}
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href} className="flex-shrink-0">
            <Link
              href={item.href}
              className={cn(
                "hover:underline whitespace-nowrap transition-colors",
                active
                  ? "text-primary font-semibold underline"
                  : "text-secondary-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}

      {/* More dropdown menu */}
      <li className="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1 hover:underline whitespace-nowrap transition-colors text-xs sm:text-sm",
              isSecondaryActive
                ? "text-primary font-semibold"
                : "text-secondary-foreground hover:text-foreground"
            )}
          >
            More
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[80vh] overflow-y-auto">
            {Object.entries(SECONDARY_NAV_ITEMS).map(([category, items], index) => (
              <div key={category}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
                  {category}
                </DropdownMenuLabel>
                {items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "w-full",
                          active && "bg-accent font-medium"
                        )}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </ul>
  );
}

/**
 * Settings Navigation Component
 * Displays settings navigation items in a horizontal scrollable bar
 */
function SettingsNavigation({ pathname }: { pathname: string }) {
  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings";
    }
    return pathname.startsWith(href);
  };

  return (
    <ul className="flex items-center gap-2 sm:gap-4 lg:gap-6 py-2 sm:py-3 text-xs sm:text-sm overflow-x-auto">
      {SETTINGS_NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href} className="flex-shrink-0">
            <Link
              href={item.href}
              className={cn(
                "hover:underline whitespace-nowrap transition-colors",
                active
                  ? "text-primary font-semibold underline"
                  : "text-secondary-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Default Navigation Component
 * Placeholder for other sections (can be extended later)
 */
function DefaultNavigation() {
  return (
    <ul className="flex items-center gap-2 sm:gap-4 lg:gap-6 py-2 sm:py-3 text-xs sm:text-sm overflow-x-auto">
      <li className="flex-shrink-0">
        <Link className="hover:underline whitespace-nowrap" href="#">
          Dashboard
        </Link>
      </li>
    </ul>
  );
}

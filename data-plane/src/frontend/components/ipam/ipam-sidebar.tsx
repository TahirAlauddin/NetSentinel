"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * IPAM Sidebar component
 * This component displays the IPAM navigation sidebar with links to different IPAM sections.
 * @returns {JSX.Element}
 */
export function IpamSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      section: "SUBNETS",
      links: [
        { href: "/ipam", label: "Dashboard" },
        { href: "/ipam/subnets", label: "Subnets" },
        { href: "/ipam/subnet-groups", label: "Subnet Groups" },
        { href: "/ipam/favourite-subnets", label: "Favourite Subnets" },
        { href: "/ipam/customers", label: "Customers" },
        { href: "/ipam/vlans", label: "VLAN" },
        { href: "/ipam/vrfs", label: "VRF" },
        { href: "/ipam/nat", label: "NAT" },
        { href: "/ipam/routing", label: "Routing" },
        { href: "/ipam/firewall-zones", label: "Firewall Zones" },
        { href: "/ipam/scanned-networks", label: "Scanned Networks" },
        { href: "/ipam/subnet-masks", label: "Subnet Masks" },
        { href: "/ipam/temporary-shares", label: "Temporary Shares" },
        { href: "/ipam/inactive-hosts", label: "Inactive Hosts" },
        { href: "/ipam/duplicates", label: "Duplicates" },
        { href: "/ipam/threshold", label: "Threshold" },
      ],
    },
    {
      section: "DEVICES",
      links: [
        { href: "/ipam/devices", label: "Devices" },
        { href: "/ipam/racks", label: "Racks" },
        { href: "/ipam/circuits", label: "Circuits" },
        { href: "/ipam/locations", label: "Locations" },
      ],
    },
    {
      section: "TOOLS",
      links: [
        { href: "/ipam/documentation", label: "Documentation" },
        { href: "/ipam/search", label: "Search" },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/ipam") {
      return pathname === "/ipam";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-56 bg-[oklch(0.96_0_0)] p-6 border-r border-border">
      <div className="space-y-8">
        {navItems.map((section) => (
          <div key={section.section} className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {section.section}
            </div>
            <nav className="space-y-1">
              {section.links.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm transition-colors",
                      active
                        ? "bg-[oklch(0.93_0_0)] text-[oklch(0.40_0.15_249)] font-medium"
                        : "hover:bg-[oklch(0.93_0_0)] text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}


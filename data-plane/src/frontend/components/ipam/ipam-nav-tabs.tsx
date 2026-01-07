"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface IpamNavTabsProps {
  tabs?: Array<{ href: string; label: string }>;
}

/**
 * IPAM Navigation Tabs component
 * This component displays horizontal navigation tabs for IPAM sections.
 * @param {IpamNavTabsProps} props - The props for the IpamNavTabs component.
 * @param {Array<{href: string; label: string}>} props.tabs - Optional custom tabs. If not provided, uses default IPAM tabs.
 * @returns {JSX.Element}
 */
export function IpamNavTabs({ tabs }: IpamNavTabsProps) {
  const pathname = usePathname();

  const defaultTabs = [
    { href: "/ipam", label: "Dashboard" },
    { href: "/ipam/subnets", label: "Subnets" },
    { href: "/ipam/customers", label: "Customers" },
    { href: "/ipam/vlans", label: "VLANs" },
    { href: "/ipam/vrfs", label: "VRFs" },
  ];

  const displayTabs = tabs || defaultTabs;

  return (
    <div className="flex gap-8 border-b border-border pb-4">
      {displayTabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/ipam" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "text-sm transition-colors",
              isActive
                ? "font-medium text-[oklch(0.40_0.15_249)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}


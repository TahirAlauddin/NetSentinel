"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ipamMainSubmenuLinks,
  ipamSubnetManagementSubmenuLinks,
  ipamNetworkServicesSubmenuLinks,
  ipamInfrastructureSubmenuLinks,
  ipamToolsSubmenuLinks,
} from "@/constants/navigation";

interface IpamNavTabsProps {
  tabs?: Array<{ href: string; label: string }>;
  category?: "main" | "subnetManagement" | "networkServices" | "infrastructure" | "tools";
}

/**
 * Get the category for a given path
 */
function getCategoryForPath(pathname: string): keyof typeof categoryLinks | null {
  const normalizedPath = pathname.replace(/\/$/, "");
  
  for (const [categoryKey, links] of Object.entries(categoryLinks)) {
    const match = links.find((link) => {
      const linkPath = link.href.replace(/\/$/, "");
      return normalizedPath === linkPath || normalizedPath.startsWith(linkPath + "/");
    });
    
    if (match) {
      return categoryKey as keyof typeof categoryLinks;
    }
  }
  return null;
}

const categoryLinks = {
  main: ipamMainSubmenuLinks,
  subnetManagement: ipamSubnetManagementSubmenuLinks,
  networkServices: ipamNetworkServicesSubmenuLinks,
  infrastructure: ipamInfrastructureSubmenuLinks,
  tools: ipamToolsSubmenuLinks,
};

/**
 * IPAM Navigation Tabs component
 * Displays contextual navigation tabs based on the current route or provided category.
 * Shows tabs from the same category as the current page.
 * 
 * @param {IpamNavTabsProps} props - The props for the IpamNavTabs component.
 * @param {Array<{href: string; label: string}>} props.tabs - Optional custom tabs. If not provided, uses contextual tabs based on current route.
 * @param {string} props.category - Optional category override. If not provided, auto-detects from pathname.
 * @returns {JSX.Element}
 */
export function IpamNavTabs({ tabs, category }: IpamNavTabsProps) {
  const pathname = usePathname();

  // Use provided tabs if available
  if (tabs && tabs.length > 0) {
    return (
      <div className="flex gap-6 md:gap-8 border-b border-border pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/ipam" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "text-sm transition-colors whitespace-nowrap flex-shrink-0 relative pb-4 -mb-4",
                isActive
                  ? "font-medium text-[oklch(0.40_0.15_249)] border-b-2 border-[oklch(0.40_0.15_249)]"
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

  // Auto-detect category or use provided category
  const detectedCategory = category || getCategoryForPath(pathname);
  const contextualTabs = detectedCategory ? categoryLinks[detectedCategory] : ipamMainSubmenuLinks;

  // Filter out the current page from tabs to avoid redundancy
  const displayTabs = contextualTabs.filter((tab) => {
    const tabPath = tab.href.replace(/\/$/, "");
    const currentPath = pathname.replace(/\/$/, "");
    // Don't show exact match, but show parent paths for nested routes
    return tabPath !== currentPath;
  });

  // Hide nav tabs when they would duplicate the header's "Related Pages" section
  // The header already shows contextual navigation, so nav tabs are redundant
  // Only show nav tabs for nested routes (e.g., /subnets/123/edit) where they provide breadcrumb-like navigation
  const isNestedRoute = pathname.split("/").filter(Boolean).length > 2; // e.g., /ipam/subnets/123
  
  // Don't show nav tabs on top-level pages - header already provides navigation
  if (!isNestedRoute && !tabs) {
    return null;
  }

  // If no contextual tabs after filtering, don't show nav tabs
  if (displayTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-6 md:gap-8 border-b border-border pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {displayTabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/ipam" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "text-sm transition-colors whitespace-nowrap flex-shrink-0 relative pb-4 -mb-4",
              isActive
                ? "font-medium text-[oklch(0.40_0.15_249)] border-b-2 border-[oklch(0.40_0.15_249)]"
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

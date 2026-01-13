"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Network,
  Users,
  FolderTree,
  Router,
  Server,
  Search,
  BookOpen,
  Layers,
  Shield,
  Route,
  Building2,
  Activity,
  Star,
  Eye,
  Copy,
  Share2,
  AlertCircle,
  GitBranch,
  MapPin,
  Cable,
  FileCheck,
} from "lucide-react";
import {
  ipamMainSubmenuLinks,
  ipamSubnetManagementSubmenuLinks,
  ipamNetworkServicesSubmenuLinks,
  ipamInfrastructureSubmenuLinks,
  ipamToolsSubmenuLinks,
} from "@/constants/navigation";

interface IpamHeaderProps {
  currentPage: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

// Icon mapping for different IPAM sections
const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  // Main
  "/ipam": LayoutDashboard,
  "/ipam/subnets": Network,
  "/ipam/subnet-groups": FolderTree,
  "/ipam/customers": Users,
  "/ipam/vlans": Layers,
  "/ipam/vrfs": Router,
  "/ipam/devices": Server,
  "/ipam/ip-requests": FileCheck,
  // Subnet Management
  "/ipam/favourite-subnets": Star,
  "/ipam/scanned-networks": Eye,
  "/ipam/subnet-masks": Copy,
  "/ipam/temporary-shares": Share2,
  "/ipam/inactive-hosts": AlertCircle,
  "/ipam/duplicates": GitBranch,
  "/ipam/threshold": Activity,
  // Network Services
  "/ipam/nat": Network,
  "/ipam/routing": Route,
  "/ipam/firewall-zones": Shield,
  // Infrastructure
  "/ipam/racks": Building2,
  "/ipam/circuits": Cable,
  "/ipam/locations": MapPin,
  // Tools
  "/ipam/search": Search,
  "/ipam/documentation": BookOpen,
};

// Category configuration
const categoryConfig = {
  main: {
    title: "Main",
    icon: LayoutDashboard,
    links: ipamMainSubmenuLinks,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  subnetManagement: {
    title: "Subnet Management",
    icon: Network,
    links: ipamSubnetManagementSubmenuLinks,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  networkServices: {
    title: "Network Services",
    icon: Router,
    links: ipamNetworkServicesSubmenuLinks,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  infrastructure: {
    title: "Infrastructure",
    icon: Building2,
    links: ipamInfrastructureSubmenuLinks,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  tools: {
    title: "Tools",
    icon: Search,
    links: ipamToolsSubmenuLinks,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
};

/**
 * Get the category for a given path
 */
function getCategoryForPath(pathname: string): keyof typeof categoryConfig | null {
  // Normalize pathname - remove trailing slashes and handle nested routes
  const normalizedPath = pathname.replace(/\/$/, "");
  
  // Check each category's links to find a match
  for (const [categoryKey, config] of Object.entries(categoryConfig)) {
    // Check if pathname matches any link in this category
    const match = config.links.find((link) => {
      const linkPath = link.href.replace(/\/$/, "");
      // Exact match or pathname starts with link path (for nested routes)
      return normalizedPath === linkPath || normalizedPath.startsWith(linkPath + "/");
    });
    
    if (match) {
      return categoryKey as keyof typeof categoryConfig;
    }
  }
  return null;
}

/**
 * Get related links for the current category, excluding the current page
 */
function getRelatedLinks(
  pathname: string,
  category: keyof typeof categoryConfig | null
): Array<{ label: string; href: string }> {
  if (!category) return [];
  const config = categoryConfig[category];
  const normalizedPath = pathname.replace(/\/$/, "");
  
  return config.links.filter((link) => {
    const linkPath = link.href.replace(/\/$/, "");
    // Exclude exact match
    if (normalizedPath === linkPath) return false;
    // Exclude if current path is a child of this link (e.g., /subnets/123 should exclude /subnets)
    if (normalizedPath.startsWith(linkPath + "/")) return false;
    return true;
  });
}

/**
 * Get the icon component for the current page
 */
function getPageIcon(pathname: string): React.ComponentType<{ className?: string }> {
  // Try exact match first
  if (sectionIcons[pathname]) {
    return sectionIcons[pathname];
  }
  // Try prefix match
  for (const [path, Icon] of Object.entries(sectionIcons)) {
    if (pathname.startsWith(path)) {
      return Icon;
    }
  }
  return Network; // Default icon
}

/**
 * Auto-generate breadcrumbs based on pathname
 */
function generateBreadcrumbsFromPath(pathname: string): Array<{ label: string; href: string }> {
  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: "IPAM", href: "/ipam" },
  ];

  // Remove leading/trailing slashes and split
  const pathParts = pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
  
  // Skip "ipam" part as we already have it
  if (pathParts[0] === "ipam") {
    pathParts.shift();
  }

  // Map paths to categories and labels
  const pathToCategory: Record<string, { category: string; label: string; href: string }> = {
    // Main category
    "subnets": { category: "Main", label: "Subnets", href: "/ipam/subnets" },
    "subnet-groups": { category: "Main", label: "Subnet Groups", href: "/ipam/subnet-groups" },
    "customers": { category: "Main", label: "Customers", href: "/ipam/customers" },
    "vlans": { category: "Main", label: "VLAN", href: "/ipam/vlans" },
    "vrfs": { category: "Main", label: "VRF", href: "/ipam/vrfs" },
    "devices": { category: "Main", label: "Devices", href: "/ipam/devices" },
    "ip-requests": { category: "Main", label: "IP Requests", href: "/ipam/ip-requests" },
    "phone-numbers": { category: "Main", label: "Phone Numbers", href: "/ipam/phone-numbers" },
    
    // Tools category
    "search": { category: "Tools", label: "Search", href: "/ipam/search" },
    "documentation": { category: "Tools", label: "Documentation", href: "/ipam/documentation" },
    
    // Subnet Management category
    "favourite-subnets": { category: "Subnet Management", label: "Favourite Subnets", href: "/ipam/favourite-subnets" },
    "scanned-networks": { category: "Subnet Management", label: "Scanned Networks", href: "/ipam/scanned-networks" },
    "subnet-masks": { category: "Subnet Management", label: "Subnet Masks", href: "/ipam/subnet-masks" },
    "temporary-shares": { category: "Subnet Management", label: "Temporary Shares", href: "/ipam/temporary-shares" },
    "inactive-hosts": { category: "Subnet Management", label: "Inactive Hosts", href: "/ipam/inactive-hosts" },
    "duplicates": { category: "Subnet Management", label: "Duplicates", href: "/ipam/duplicates" },
    "threshold": { category: "Subnet Management", label: "Threshold", href: "/ipam/threshold" },
    
    // Network Services category
    "nat": { category: "Network Services", label: "NAT", href: "/ipam/nat" },
    "routing": { category: "Network Services", label: "Routing", href: "/ipam/routing" },
    "firewall-zones": { category: "Network Services", label: "Firewall Zones", href: "/ipam/firewall-zones" },
    
    // Infrastructure category
    "racks": { category: "Infrastructure", label: "Racks", href: "/ipam/racks" },
    "circuits": { category: "Infrastructure", label: "Circuits", href: "/ipam/circuits" },
    "locations": { category: "Infrastructure", label: "Locations", href: "/ipam/locations" },
  };

  // Category hrefs
  const categoryHrefs: Record<string, string> = {
    "Main": "/ipam",
    "Tools": "/ipam/search",
    "Subnet Management": "/ipam/favourite-subnets",
    "Network Services": "/ipam/nat",
    "Infrastructure": "/ipam/racks",
  };

  if (pathParts.length === 0) {
    // Dashboard page
    return breadcrumbs;
  }

  const firstPart = pathParts[0];
  const pathInfo = pathToCategory[firstPart];

  if (pathInfo) {
    // Add category breadcrumb
    breadcrumbs.push({
      label: pathInfo.category,
      href: categoryHrefs[pathInfo.category],
    });

    // Add page breadcrumb (if not dashboard)
    if (firstPart !== "") {
      breadcrumbs.push({
        label: pathInfo.label,
        href: pathInfo.href,
      });

      // Handle nested routes (e.g., /subnets/123, /subnets/edit/123)
      if (pathParts.length > 1) {
        const secondPart = pathParts[1];
        
        // Handle edit/new pages
        if (secondPart === "edit" && pathParts[2]) {
          breadcrumbs.push({ label: "Edit", href: `${pathInfo.href}/edit/${pathParts[2]}` });
        } else if (secondPart === "new") {
          breadcrumbs.push({ label: "New", href: `${pathInfo.href}/new` });
        } else if (secondPart && !isNaN(Number(secondPart))) {
          // It's a detail page (ID)
          breadcrumbs.push({ label: `#${secondPart}`, href: `${pathInfo.href}/${secondPart}` });
        }
      }
    }
  }

  return breadcrumbs;
}

/**
 * IPAM Header component with dynamic contextual navigation
 * Shows related navigation links based on the current section
 */
export function IpamHeader({ currentPage, breadcrumbs }: IpamHeaderProps) {
  const pathname = usePathname();
  const category = getCategoryForPath(pathname);
  const relatedLinks = getRelatedLinks(pathname, category);
  const categoryConfigData = category ? categoryConfig[category] : null;
  
  // Get the icon component - this is safe because it returns a component class, not an instance
  const PageIconComponent = getPageIcon(pathname);

  // Use provided breadcrumbs or auto-generate from pathname
  const finalBreadcrumbs = breadcrumbs && breadcrumbs.length > 0 
    ? breadcrumbs.map((crumb) => {
        // If href is missing or "#", try to generate it from the label
        if (!crumb.href || crumb.href === "#") {
          const labelToRoute: Record<string, string> = {
            "IPAM": "/ipam",
            "Dashboard": "/ipam",
            "Main": "/ipam",
            "Tools": "/ipam/search",
            "Subnet Management": "/ipam/favourite-subnets",
            "Network Services": "/ipam/nat",
            "Infrastructure": "/ipam/racks",
            "Subnets": "/ipam/subnets",
            "Subnet Groups": "/ipam/subnet-groups",
            "Customers": "/ipam/customers",
            "VLAN": "/ipam/vlans",
            "VLANs": "/ipam/vlans",
            "VRF": "/ipam/vrfs",
            "VRFs": "/ipam/vrfs",
            "Devices": "/ipam/devices",
            "IP Requests": "/ipam/ip-requests",
            "Search": "/ipam/search",
            "Documentation": "/ipam/documentation",
          };
          
          const route = labelToRoute[crumb.label];
          if (route) {
            return { ...crumb, href: route };
          }
        }
        return crumb;
      })
    : generateBreadcrumbsFromPath(pathname);

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {finalBreadcrumbs && finalBreadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          {finalBreadcrumbs.map((crumb, index) => {
            const isLast = index === finalBreadcrumbs.length - 1;
            const href = crumb.href && crumb.href !== "#" ? crumb.href : null;
            
            return (
              <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                {href ? (
                  <Link 
                    href={href} 
                    className="hover:text-foreground hover:underline transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-foreground" : ""}>{crumb.label}</span>
                )}
                {!isLast && <span className="text-muted-foreground/50">›</span>}
              </div>
            );
          })}
        </nav>
      )}

      {/* Main Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {React.createElement(PageIconComponent, {
            className: cn(
              "h-5 w-5 flex-shrink-0",
              categoryConfigData?.color || "text-muted-foreground"
            ),
          })}
          <div>
            <h1 className="text-3xl font-bold">{currentPage}</h1>
            {categoryConfigData && (
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1 inline-block">
                {categoryConfigData.title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Quick Links - Redesigned */}
      {relatedLinks.length > 0 && categoryConfigData && (
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <categoryConfigData.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {categoryConfigData.title}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {relatedLinks.slice(0, 8).map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              const LinkIcon = sectionIcons[link.href] || Network;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all group",
                    "hover:bg-accent/50 hover:shadow-sm",
                    isActive
                      ? "bg-accent text-[oklch(0.40_0.15_249)] font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LinkIcon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-opacity",
                    isActive ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                  )} />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
            {relatedLinks.length > 8 && (
              <Link
                href={categoryConfigData.links[0]?.href || "/ipam"}
                className="flex items-center justify-center px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all border border-dashed border-border hover:border-foreground/20"
              >
                <span className="truncate">+{relatedLinks.length - 8} more</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cross-Category Quick Access - Redesigned */}
      {category && category !== "main" && (
        <div className="pt-4 border-t border-border/50">
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryConfig)
              .filter(([key]) => key !== category)
              .map(([key, config]) => {
                const firstLink = config.links[0];
                if (!firstLink) return null;
                
                return (
                  <Link
                    key={key}
                    href={firstLink.href}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all border border-transparent hover:border-border"
                  >
                    <config.icon className="h-3.5 w-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="whitespace-nowrap">{config.title}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

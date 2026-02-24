"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  List,
  BarChart3,
  Monitor,
  Smartphone,
  MapPin,
  Shield,
  Package,
  Building2,
  DollarSign,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const mainNavItems: NavItem[] = [
  {
    label: "Overview",
    href: "/assets",
    icon: LayoutDashboard,
    description: "Asset management dashboard",
  },
  {
    label: "All Assets",
    href: "/assets/list",
    icon: List,
    description: "View and manage all assets",
  },
  {
    label: "Reporting",
    href: "/assets/reporting",
    icon: BarChart3,
    description: "Asset insights and analytics",
  },
];

const HREF_TO_INSIGHT: Record<string, string> = {
  "/assets/reporting/operating-system": "Operating System",
  "/assets/reporting/applications": "Applications",
  "/assets/reporting/location": "Location",
  "/assets/reporting/warranty": "Warranty",
  "/assets/reporting/model": "Model",
  "/assets/reporting/asset-type": "Asset Type",
  "/assets/reporting/department": "Department",
  "/assets/reporting/cost": "Cost",
  "/assets/reporting/firmware": "Firmware",
};

const reportingNavItems: NavItem[] = [
  {
    label: "Operating System",
    href: "/assets/reporting/operating-system",
    icon: Monitor,
    description: "OS distribution analysis",
  },
  {
    label: "Applications",
    href: "/assets/reporting/applications",
    icon: Smartphone,
    description: "Application inventory",
  },
  {
    label: "Location",
    href: "/assets/reporting/location",
    icon: MapPin,
    description: "Geographic distribution",
  },
  {
    label: "Warranty",
    href: "/assets/reporting/warranty",
    icon: Shield,
    description: "Warranty status tracking",
  },
  {
    label: "Model",
    href: "/assets/reporting/model",
    icon: Package,
    description: "Model distribution",
  },
  {
    label: "Asset Type",
    href: "/assets/reporting/asset-type",
    icon: Package,
    description: "Category breakdown",
  },
  {
    label: "Department",
    href: "/assets/reporting/department",
    icon: Building2,
    description: "Department allocation",
  },
  {
    label: "Cost",
    href: "/assets/reporting/cost",
    icon: DollarSign,
    description: "Cost analysis",
  },
  {
    label: "Firmware",
    href: "/assets/reporting/firmware",
    icon: Cpu,
    description: "Firmware versions",
  },
];

export interface AssetsDashboardNavProps {
  /** When provided, reporting insight clicks open a modal instead of navigating. */
  onOpenReportingInsight?: (insightTitle: string) => void;
  /** When set, the reporting insight with this title is shown as active (e.g. modal open). */
  activeReportingInsight?: string | null;
}

export function AssetsDashboardNav({
  onOpenReportingInsight,
  activeReportingInsight,
}: AssetsDashboardNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const isReportingPage = pathname.startsWith("/assets/reporting");

  const handleNavClick = (href: string) => {
    const insightTitle = HREF_TO_INSIGHT[href];
    if (isReportingPage && insightTitle && onOpenReportingInsight) {
      onOpenReportingInsight(insightTitle);
      return;
    }
    router.push(href);
  };

  const isReportingInsightActive = (href: string) => {
    const title = HREF_TO_INSIGHT[href];
    return title != null && title === activeReportingInsight;
  };

  const isActive = (href: string) => {
    if (href === "/assets") {
      return pathname === "/assets" || pathname === "/assets/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="space-y-8">
      {/* Main Navigation */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  "hover:bg-accent/50",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground border border-border hover:border-primary/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reporting Navigation - Only show if on reporting pages */}
      {isReportingPage && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reporting Insights
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {reportingNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href) || isReportingInsightActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    "hover:bg-accent/50",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-foreground border border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

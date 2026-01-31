"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  LayoutDashboard,
  List,
  BarChart3,
  Monitor,
  Smartphone,
  HardDrive,
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
    label: "Availability",
    href: "/assets/reporting/availability",
    icon: HardDrive,
    description: "Asset status overview",
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

export function AssetsDashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const isReportingPage = pathname.startsWith("/assets/reporting");

  const handleNavClick = (href: string) => {
    router.push(href);
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
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reporting Insights
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reportingNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Card
                  key={item.href}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => handleNavClick(item.href)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-md flex-shrink-0",
                        active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={cn(
                          "font-medium text-sm",
                          active ? "text-primary" : "text-foreground"
                        )}
                      >
                        {item.label}
                      </h4>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

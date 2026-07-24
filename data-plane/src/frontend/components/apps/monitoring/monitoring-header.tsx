"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LayoutGrid,
  Server,
  FolderOpen,
  FileCode2,
  BarChart2,
  AlertTriangle,
  Play,
  Activity,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Nav grouped into 4 logical sections with visual dividers between them */
const NAV_GROUPS: NavItem[][] = [
  [
    { label: "Overview", href: "/monitoring", icon: LayoutDashboard },
    { label: "Dashboard", href: "/monitoring/dashboard", icon: LayoutGrid },
  ],
  [
    { label: "Hosts", href: "/monitoring/hosts", icon: Server },
    { label: "Templates", href: "/monitoring/templates", icon: FileCode2 },
  ],
  [
    { label: "Problems", href: "/monitoring/problems", icon: AlertTriangle },
    { label: "Events", href: "/monitoring/events", icon: Activity },
    { label: "Actions", href: "/monitoring/actions", icon: Play },
  ],
];

const ALL_NAV_ITEMS = NAV_GROUPS.flat();

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/monitoring": LayoutDashboard,
  "/monitoring/dashboard": LayoutGrid,
  "/monitoring/hosts": Server,
  "/monitoring/host-groups": FolderOpen,
  "/monitoring/templates": FileCode2,
  "/monitoring/items": BarChart2,
  "/monitoring/problems": AlertTriangle,
  "/monitoring/events": Activity,
  "/monitoring/actions": Play,
};

function getPageIcon(
  pathname: string
): React.ComponentType<{ className?: string }> {
  const exact = SECTION_ICONS[pathname];
  if (exact) return exact;
  for (const [path, Icon] of Object.entries(SECTION_ICONS)) {
    if (pathname.startsWith(path + "/")) return Icon;
  }
  return Activity;
}

function generateBreadcrumbs(
  pathname: string
): Array<{ label: string; href?: string }> {
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Monitoring", href: "/monitoring" },
  ];
  const found = ALL_NAV_ITEMS.find(
    (item) =>
      pathname === item.href || pathname.startsWith(item.href + "/")
  );
  if (found && found.href !== "/monitoring") {
    crumbs.push({ label: found.label, href: found.href });
  }
  const parts = pathname.replace(/^\/monitoring\//, "").split("/");
  if (found && parts.length > 1) {
    const sub = parts[1];
    if (sub === "add" || sub === "new") {
      crumbs.push({ label: "Add" });
    } else if (!isNaN(Number(sub))) {
      crumbs.push({ label: `#${sub}` });
    }
  }
  return crumbs;
}

interface MonitoringHeaderProps {
  currentPage: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function MonitoringHeader({
  currentPage,
  breadcrumbs,
}: MonitoringHeaderProps) {
  const pathname = usePathname();
  // getPageIcon only selects among the stable, module-level icon components in
  // SECTION_ICONS (or Activity) — it never defines a new component.
  const PageIcon = getPageIcon(pathname);
  const finalCrumbs =
    breadcrumbs?.length ? breadcrumbs : generateBreadcrumbs(pathname);

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        {finalCrumbs.map((crumb, i) => {
          const isLast = i === finalCrumbs.length - 1;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              )}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? "text-foreground font-medium" : undefined
                  }
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Page title with icon badge */}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-950/40 shrink-0">
          {/* eslint-disable-next-line react-hooks/static-components -- PageIcon is
              picked from a fixed set of module-level icons, not created here */}
          <PageIcon className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{currentPage}</h1>
      </div>

      {/* Grouped nav bar */}
      <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-border/60">
        {NAV_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <span
                className="h-4 w-px bg-border/70 mx-0.5 shrink-0"
                aria-hidden
              />
            )}
            {group.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/monitoring" &&
                  pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    isActive
                      ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/50 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/settings", label: "Overview" },
    { href: "/settings/locations", label: "Locations" },
    { href: "/settings/circuits", label: "Circuits" },
    { href: "/settings/departments", label: "Departments" },
    { href: "/settings/categories", label: "Categories" },
    { href: "/settings/carrier-contacts", label: "Carrier Contacts" },
    { href: "/settings/email-format", label: "Email Format" },
  ];

  return (
    <div className="flex gap-8 border-b border-border pb-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm ${
              isActive
                ? "font-medium text-[oklch(0.40_0.15_249)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}


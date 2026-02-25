"use client";

import Link from "next/link";

export interface TelecomBreadcrumbItem {
  label: string;
  href?: string;
}

interface TelecomBreadcrumbProps {
  items: TelecomBreadcrumbItem[];
}

/**
 * Breadcrumb navigation for Telecom Expense Management pages.
 * First item is typically "Telecom" linking to overview; last item is current page (no link).
 */
export function TelecomBreadcrumb({ items }: TelecomBreadcrumbProps) {
  return (
    <nav
      className="flex items-center gap-2 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden>›</span>}
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground" : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

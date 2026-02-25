"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface ContractsBreadcrumbItem {
  label: string;
  href?: string;
}

export interface ContractsBreadcrumbProps {
  items: ContractsBreadcrumbItem[];
}

/**
 * Shared breadcrumb header for all contract pages. Renders a white bar
 * with border and consistent padding; items are links when href is set.
 */
export function ContractsBreadcrumb({ items }: ContractsBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4">
      <nav
        className="flex items-center gap-2 flex-wrap"
        aria-label="Breadcrumb"
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <ChevronRight
                className="w-4 h-4 text-gray-400 shrink-0"
                aria-hidden
              />
            )}
            {item.href != null ? (
              <Link
                href={item.href}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-900">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { Sidebar } from "./sidebar";

export function AppLayoutSidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "hidden lg:block flex-shrink-0 overflow-visible transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <Sidebar />
    </div>
  );
}

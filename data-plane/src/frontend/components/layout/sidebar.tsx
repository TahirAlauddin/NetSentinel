"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { BrandHeader } from "./brand-header"
import { Navigation } from "../navigation/navigation"
import { navigationItems } from "../../constants/navigation"
import { SidebarProps } from "../../types/navigation"
import { usePermissions } from "@/contexts/permissions-context"
import { useSidebarOptional } from "@/contexts/sidebar-context"

export function Sidebar({ onClose }: SidebarProps) {
  const { permissions } = usePermissions()
  const sidebar = useSidebarOptional()
  const isCollapsed = sidebar?.isCollapsed ?? false

  const filteredItems = useMemo(() => {
    return navigationItems
      .filter((item) => {
        if (!item.requiredPermission) return true
        return permissions.includes(item.requiredPermission)
      })
      .map((item) => {
        if (!item.submenuColumns) return item
        const filteredColumns = item.submenuColumns
          .map((col) => ({
            ...col,
            links: col.links.filter((link) => {
              if (!link.requiredPermission) return true
              return permissions.includes(link.requiredPermission)
            }),
          }))
          .filter((col) => col.links.length > 0)
        return { ...item, submenuColumns: filteredColumns }
      })
  }, [permissions])

  return (
    <div
      data-sidebar
      className={cn(
        "top-0 h-screen bg-[oklch(0.24_0_0)] text-white overflow-y-auto overflow-x-visible z-30 relative flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
      onMouseLeave={() => {
        // When mouse leaves the entire sidebar, the Navigation component
        // will handle closing submenus via its own onMouseLeave handler
      }}
    >
      <BrandHeader onClose={onClose} collapsed={isCollapsed && !onClose} />
      <Navigation items={filteredItems} collapsed={isCollapsed && !onClose} />
      {!isCollapsed && (
        <div className="mt-auto px-4 py-3 text-xs text-white/70 border-t border-white/10">
          LIVE HELP
        </div>
      )}
    </div>
  )
}

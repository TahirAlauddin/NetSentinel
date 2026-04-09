"use client"

import { useMemo } from "react"
import { BrandHeader } from "./brand-header"
import { Navigation } from "../navigation/navigation"
import { navigationItems } from "../../constants/navigation"
import { SidebarProps } from "../../types/navigation"
import { usePermissions } from "@/contexts/permissions-context"

export function Sidebar({ onClose }: SidebarProps) {
  const { permissions } = usePermissions()

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
      className="top-0 h-screen bg-[oklch(0.24_0_0)] text-white overflow-y-auto overflow-x-visible z-30 relative"
      onMouseLeave={() => {
        // When mouse leaves the entire sidebar, the Navigation component
        // will handle closing submenus via its own onMouseLeave handler
      }}
    >
      <BrandHeader onClose={onClose} />
      <Navigation 
        items={filteredItems} 
      />
      {/* Footer help */}
      <div className="mt-2 px-4 py-3 text-xs text-white/70 border-t border-white/10">
        LIVE HELP
      </div>
    </div>
  )
}

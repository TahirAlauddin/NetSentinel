"use client"

import { X, ChevronsLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { brandConfig } from "../../constants/navigation"
import { useSidebarOptional } from "@/contexts/sidebar-context"

interface BrandHeaderProps {
  onClose?: () => void
  collapsed?: boolean
}

export function BrandHeader({ onClose, collapsed = false }: BrandHeaderProps) {
  const LogoIcon = brandConfig.logo
  const sidebar = useSidebarOptional()
  const showCollapseToggle = sidebar && !onClose && !collapsed

  return (
    <div
      className={cn(
        "flex w-full items-center h-14 border-b border-white/10 shrink-0",
        collapsed ? "justify-center px-2" : "gap-1 px-3"
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center",
          collapsed ? "justify-center" : "flex-1 gap-3"
        )}
        title={collapsed ? brandConfig.name : undefined}
      >
        <div
          className={`inline-flex shrink-0 items-center justify-center w-9 h-9 rounded ${brandConfig.logoColor}`}
        >
          <LogoIcon className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-none min-w-0 flex-1">
            <div className="text-base font-semibold truncate">{brandConfig.name}</div>
            <div className="text-xs text-white/70 truncate">{brandConfig.subtitle}</div>
          </div>
        )}
      </div>

      {showCollapseToggle && (
        <button
          type="button"
          onClick={sidebar.toggleCollapsed}
          className="hidden lg:flex shrink-0 items-center justify-center rounded-md p-1.5 text-white/80 hover:bg-white/10 focus-visible:bg-white/10 outline-none transition-colors"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden shrink-0 p-1 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
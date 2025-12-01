"use client"

import { BrandHeader } from "./brand-header"
import { Navigation } from "../navigation/navigation"
import { navigationItems } from "../../constants/navigation"
import { SidebarProps } from "../../types/navigation"

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="top-0 h-screen bg-[oklch(0.24_0_0)] text-white overflow-y-auto overflow-x-visible z-30 relative">
      <BrandHeader onClose={onClose} />
      <Navigation 
        items={navigationItems} 
      />
      {/* Footer help */}
      <div className="mt-2 px-4 py-3 text-xs text-white/70 border-t border-white/10">
        LIVE HELP
      </div>
    </div>
  )
}

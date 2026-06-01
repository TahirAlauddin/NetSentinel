import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { NavigationItem } from "../../types/navigation"
import { brandConfig } from "../../constants/navigation"
import { Submenu } from "../submenu"
import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useSidebarOptional } from "@/contexts/sidebar-context"

interface NavigationItemProps {
  item: NavigationItem
  isExpanded: boolean
  collapsed?: boolean
  itemRef: (el: HTMLElement | null) => void
  onToggleSubmenu: (itemLabel: string) => void
  onCloseSubmenu: () => void
  onItemHover?: (itemLabel: string) => void
  onItemLeave?: () => void
  onSubmenuEnter?: () => void
}

export function NavigationItemComponent({
  item,
  isExpanded,
  collapsed = false,
  itemRef,
  onToggleSubmenu,
  onCloseSubmenu,
  onItemHover,
  onItemLeave,
  onSubmenuEnter,
}: NavigationItemProps) {
  const sidebar = useSidebarOptional()
  const Icon = item.icon
  const hasSubmenu = item.hasSubmenu || false
  const [submenuTop, setSubmenuTop] = useState(0)
  const itemElementRef = useRef<HTMLLIElement>(null)

  const handleSubmenuToggle = () => {
    onToggleSubmenu(item.label)
  }

  useEffect(() => {
    if (itemElementRef.current && isExpanded) {
      const rect = itemElementRef.current.getBoundingClientRect()
      setSubmenuTop(rect.top)
    }
  }, [isExpanded])

  return (
    <li 
      className="group"
      ref={(el) => {
        itemRef(el)
        if (itemElementRef.current !== el) {
          (itemElementRef as React.MutableRefObject<HTMLLIElement | null>).current = el
        }
      }}
      onMouseEnter={() => {
        if (hasSubmenu && onItemHover && (collapsed || window.innerWidth >= 1024)) {
          onItemHover(item.label)
        }
      }}
      onMouseLeave={(e) => {
        if (hasSubmenu && onItemLeave) {
          const relatedTarget = e.relatedTarget
          
          // relatedTarget can be Window, HTMLElement, or null
          // Check if it's an HTMLElement before using DOM methods
          if (relatedTarget instanceof HTMLElement) {
            // Check if the mouse is moving to a submenu element or staying in sidebar
            const isMovingToSubmenu = relatedTarget.closest('[role="menu"]') !== null
            const isMovingToSidebar =
              relatedTarget.closest('nav') !== null ||
              relatedTarget.closest('[data-sidebar]') !== null
            
            // Only close if not moving to submenu or sidebar
            if (!isMovingToSubmenu && !isMovingToSidebar) {
              onItemLeave()
            }
          } else {
            // relatedTarget is Window or null - mouse is leaving to main content
            onItemLeave()
          }
        }
      }}
    >
      <div className="flex items-center">
        <Link
          href={item.href}
          title={collapsed ? item.label : undefined}
          className={cn(
            "relative flex items-center hover:bg-white/10 focus-visible:bg-white/10 outline-none flex-1",
            collapsed
              ? "justify-center px-2 py-3"
              : "gap-3 px-4 py-3"
          )}
        >
          {item.active && (
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-full w-1",
                brandConfig.activeBarColor,
                collapsed ? "left-0" : "left-0"
              )}
            />
          )}
          <Icon className="w-4 h-4 shrink-0 text-white/90" />
          {!collapsed && <span className="text-sm truncate">{item.label}</span>}
        </Link>

        {hasSubmenu && !collapsed && (
          <button
            className="lg:hidden px-2 py-3 hover:bg-white/10 focus-visible:bg-white/10 outline-none"
            aria-label={`Toggle ${item.label} submenu`}
            aria-expanded={isExpanded}
            onClick={handleSubmenuToggle}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white/70" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/70" />
            )}
          </button>
        )}
      </div>

      {/* Submenu - shown on hover for desktop, click for mobile/tablet */}
      {hasSubmenu && item.submenuColumns && (
        <Submenu
          columns={item.submenuColumns}
          isVisible={isExpanded}
          onClose={onCloseSubmenu}
          onMouseEnter={onSubmenuEnter}
          top={submenuTop}
          sidebarWidth={sidebar?.sidebarWidth}
        />
      )}
    </li>
  )
}

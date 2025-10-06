import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { NavigationItem } from "../types/navigation"
import { brandConfig } from "../constants/navigation"
import { Submenu } from "./submenu"
import { useRef, useEffect, useState } from "react"

interface NavigationItemProps {
  item: NavigationItem
  isExpanded: boolean
  itemRef: (el: HTMLElement | null) => void
  onToggleSubmenu: (itemLabel: string) => void
  onCloseSubmenu: () => void
  onItemHover?: (itemLabel: string) => void
  onItemLeave?: () => void
}

export function NavigationItemComponent({
  item,
  isExpanded,
  itemRef,
  onToggleSubmenu,
  onCloseSubmenu,
  onItemHover,
  onItemLeave,
}: NavigationItemProps) {
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
        if (hasSubmenu && onItemHover) {
          onItemHover(item.label)
        }
      }}
      onMouseLeave={() => {
        if (hasSubmenu && onItemLeave) {
          onItemLeave()
        }
      }}
    >
      <div className="flex items-center">
        <Link
          href={item.href}
          className="relative flex items-center gap-3 px-4 py-3 hover:bg-white/10 focus-visible:bg-white/10 outline-none flex-1"
        >
          {/* Active indicator bar */}
          {item.active && (
            <span 
              aria-hidden 
              className={`absolute left-0 top-0 h-full w-1 ${brandConfig.activeBarColor}`} 
            />
          )}
          <Icon className="w-4 h-4 text-white/90" />
          <span className="text-sm">{item.label}</span>
        </Link>
        
        {/* Submenu toggle button - only visible on mobile/tablet */}
        {hasSubmenu && (
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
          top={submenuTop}
        />
      )}
    </li>
  )
}

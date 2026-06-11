"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { NavigationItemComponent } from "./navigation-item"
import { NavigationItem } from "../../types/navigation"
import { cn } from "@/lib/utils"

interface NavigationProps {
  items: NavigationItem[]
  /** Icon-only rail (desktop collapsed sidebar). */
  collapsed?: boolean
}

export function Navigation({ items, collapsed = false }: NavigationProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const itemRefs = useRef<Record<string, HTMLElement | null>>({})
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navigationLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Determine if a navigation item is active based on current pathname
  const isItemActive = useCallback((item: NavigationItem): boolean => {
    // Exact match
    if (pathname === item.href) {
      return true
    }

    // For items with submenus, check if current path matches any submenu item
    if (item.hasSubmenu && item.submenuColumns) {
      const allSubmenuUrls: string[] = []
      item.submenuColumns.forEach(column => {
        column.links.forEach(link => {
          allSubmenuUrls.push(link.href)
        })
      })
      if (allSubmenuUrls.includes(pathname)) {
        return true
      }
    }

    // Check if pathname starts with the item href (for nested routes)
    if (item.href !== "#" && pathname.startsWith(item.href)) {
      // Make sure it's not just a partial match (e.g., /dashboard shouldn't match /dashboard-something)
      const nextChar = pathname[item.href.length]
      return !nextChar || nextChar === "/"
    }

    return false
  }, [pathname])

  // Check if we're on desktop (lg breakpoint and above)
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)
    
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  const toggleSubmenu = useCallback((itemLabel: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemLabel)) {
        newSet.delete(itemLabel)
      } else {
        newSet.add(itemLabel)
      }
      return newSet
    })
  }, [])

  const closeSubmenu = useCallback(() => {
    setExpandedItems(new Set())
    setHoveredItem(null)
  }, [])

  const handleItemHover = useCallback((itemLabel: string) => {
    if (isDesktop) {
      // Clear any pending leave timeouts when hovering over an item
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
        leaveTimeoutRef.current = null
      }
      if (navigationLeaveTimeoutRef.current) {
        clearTimeout(navigationLeaveTimeoutRef.current)
        navigationLeaveTimeoutRef.current = null
      }
      
      setHoveredItem(itemLabel)
      setExpandedItems(new Set([itemLabel]))
    }
  }, [isDesktop])

  const handleSubmenuEnter = useCallback(() => {
    if (isDesktop) {
      // Cancel any pending leave timeouts when entering submenu
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
        leaveTimeoutRef.current = null
      }
      if (navigationLeaveTimeoutRef.current) {
        clearTimeout(navigationLeaveTimeoutRef.current)
        navigationLeaveTimeoutRef.current = null
      }
    }
  }, [isDesktop])

  const handleItemLeave = useCallback(() => {
    if (isDesktop) {
      // Clear any existing timeout
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
      
      // Set a new timeout with 500ms delay to allow time to move cursor to submenu
      leaveTimeoutRef.current = setTimeout(() => {
        setHoveredItem(null)
        setExpandedItems(new Set())
        leaveTimeoutRef.current = null
      }, 500) as NodeJS.Timeout
      if (typeof leaveTimeoutRef.current?.unref === "function") {
        leaveTimeoutRef.current.unref()
      }
    }
  }, [isDesktop])

  const setItemRef = useCallback((itemLabel: string) => (el: HTMLElement | null) => {
    itemRefs.current[itemLabel] = el
  }, [])

  // Handle mouse leave from entire navigation area
  const handleNavigationLeave = useCallback((e: React.MouseEvent) => {
    if (isDesktop) {
      const relatedTarget = e.relatedTarget
      
      // relatedTarget can be Window, HTMLElement, or null
      // Check if it's an HTMLElement and if it's moving to a submenu
      const isMovingToSubmenu = relatedTarget instanceof HTMLElement && 
        relatedTarget.closest('[role="menu"]') !== null
      
      // Only close if mouse is not moving to a submenu
      if (!isMovingToSubmenu) {
        // Clear any existing timeout
        if (navigationLeaveTimeoutRef.current) {
          clearTimeout(navigationLeaveTimeoutRef.current)
        }
        
        // Close all submenus when mouse leaves the navigation area
        // Increased timeout to 500ms to allow time to move cursor to submenu
        navigationLeaveTimeoutRef.current = setTimeout(() => {
          setHoveredItem(null)
          setExpandedItems(new Set())
          navigationLeaveTimeoutRef.current = null
        }, 500) as NodeJS.Timeout
        if (typeof navigationLeaveTimeoutRef.current?.unref === "function") {
          navigationLeaveTimeoutRef.current.unref()
        }
      }
    }
  }, [isDesktop])

  return (
    <nav
      className="flex flex-1 flex-col pt-2 min-h-0"
      onMouseLeave={handleNavigationLeave}
    >
      <ul
        className={cn(
          "flex flex-col flex-1 overflow-y-auto overflow-x-hidden",
          collapsed ? "pr-1" : "pr-3"
        )}
      >
        {items.map((item) => {
          const isExpanded = expandedItems.has(item.label) || hoveredItem === item.label
          const isActive = isItemActive(item)

          const itemWithActive = { ...item, active: isActive }

          return (
            <div key={item.label}>
              <NavigationItemComponent
                item={itemWithActive}
                isExpanded={isExpanded}
                collapsed={collapsed}
                itemRef={setItemRef(item.label)}
                onToggleSubmenu={toggleSubmenu}
                onCloseSubmenu={closeSubmenu}
                onItemHover={handleItemHover}
                onItemLeave={handleItemLeave}
                onSubmenuEnter={handleSubmenuEnter}
              />
            </div>
          )
        })}
      </ul>
    </nav>
  )
}

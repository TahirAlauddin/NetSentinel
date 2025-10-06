import { useCallback, useRef, useState, useEffect } from "react"
import { NavigationItemComponent } from "./navigation-item"
import { NavigationItem } from "../types/navigation"

interface NavigationProps {
  items: NavigationItem[]
}

export function Navigation({ items }: NavigationProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const itemRefs = useRef<Record<string, HTMLElement | null>>({})

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
      setHoveredItem(itemLabel)
      setExpandedItems(new Set([itemLabel]))
    }
  }, [isDesktop])

  const handleItemLeave = useCallback(() => {
    if (isDesktop) {
      setHoveredItem(null)
      // Delay closing to allow moving to submenu
      setTimeout(() => {
        if (!hoveredItem) {
          setExpandedItems(new Set())
        }
      }, 100)
    }
  }, [isDesktop, hoveredItem])

  const setItemRef = useCallback((itemLabel: string) => (el: HTMLElement | null) => {
    itemRefs.current[itemLabel] = el
  }, [])

  return (
    <nav className="py-2">
      <ul className="flex flex-col">
        {items.map((item) => {
          const hasSubmenu = item.hasSubmenu || false
          const isExpanded = expandedItems.has(item.label) || hoveredItem === item.label
          
          return (
            <div key={item.label}>
              <NavigationItemComponent
                item={item}
                isExpanded={isExpanded}
                itemRef={setItemRef(item.label)}
                onToggleSubmenu={toggleSubmenu}
                onCloseSubmenu={closeSubmenu}
                onItemHover={handleItemHover}
                onItemLeave={handleItemLeave}
              />
            </div>
          )
        })}
      </ul>
    </nav>
  )
}

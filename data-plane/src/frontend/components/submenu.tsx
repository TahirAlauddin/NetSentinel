"use client"

import Link from "next/link"
import { SubmenuColumn } from "../types/navigation"
import { settingsSubmenuItems } from "../constants/navigation"

interface SubmenuProps {
  columns: SubmenuColumn[]
  isVisible: boolean
  onClose: () => void
  top?: number
}

export function Submenu({ columns, isVisible, onClose, top = 0 }: SubmenuProps) {
  if (!isVisible) return null

  // If there's only one category, spread items horizontally
  const isSingleCategory = columns.length === 1
  
  // Check if this is the Settings submenu by comparing links with settingsSubmenuItems
  const isSettingsSubmenu = isSingleCategory && 
    columns[0].links.length === settingsSubmenuItems.length &&
    columns[0].links.every(link => settingsSubmenuItems.some(item => item.title === link))
  
  // Create a map of title to URL for Settings submenu
  const settingsLinkMap = new Map(settingsSubmenuItems.map(item => [item.title, item.url]))

  return (
    <div
      className="ml-2 pointer-events-auto visible opacity-100 transition-opacity duration-150 fixed z-50 w-[calc(100vw-2rem)] lg:w-[640px] bg-[oklch(0.24_0_0)] text-white shadow-xl rounded-md border border-white/10"
      role="menu"
      onMouseEnter={() => {
        // Keep submenu open when hovering over it
      }}
      onMouseLeave={onClose}
      style={{
        left: window.innerWidth >= 1024 ? '256px' : '1rem', // Desktop: sidebar width, Mobile: margin
        top: `${top}px`,
      }}
    >
      {isSingleCategory ? (
        // Single category: spread items horizontally with flex, 4 per line
        <div className="p-6 text-sm">
          {columns[0].title && (
            <div className="mb-4 font-medium text-[oklch(0.85_0_0)]">{columns[0].title}</div>
          )}
          <ul className="flex flex-wrap gap-6">
            {columns[0].links.map((link) => {
              const href = isSettingsSubmenu ? settingsLinkMap.get(link) || "#" : "#"
              return (
                <li key={link} style={{ flexBasis: 'calc(25% - 1.125rem)', minWidth: 0 }}>
                  {isSettingsSubmenu ? (
                    <Link 
                      className="hover:underline cursor-pointer block" 
                      href={href}
                      onClick={onClose}
                    >
                      {link}
                    </Link>
                  ) : (
                    <a 
                      className="hover:underline cursor-pointer block" 
                      href={href}
                      onClick={(e) => {
                        e.preventDefault()
                        // Handle link click here
                      }}
                    >
                      {link}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        // Multiple categories: use flex with calculated widths
        <div className="flex gap-6 p-6 text-sm">
          {columns.map((col, colIndex) => (
            <div key={col.title || `column-${colIndex}`} className="flex-1 min-w-0">
              {col.title && (
                <div className="mb-3 font-medium text-[oklch(0.85_0_0)]">{col.title}</div>
              )}
              <ul className="space-y-2">
                {col.links.map((link) => {
                  const href = isSettingsSubmenu ? settingsLinkMap.get(link) || "#" : "#"
                  return (
                    <li key={link}>
                      {isSettingsSubmenu ? (
                        <Link 
                          className="hover:underline cursor-pointer" 
                          href={href}
                          onClick={onClose}
                        >
                          {link}
                        </Link>
                      ) : (
                        <a 
                          className="hover:underline cursor-pointer" 
                          href={href}
                          onClick={(e) => {
                            e.preventDefault()
                            // Handle link click here
                          }}
                        >
                          {link}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

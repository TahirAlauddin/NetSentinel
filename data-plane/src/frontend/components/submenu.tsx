"use client"

import Link from "next/link"
import { SubmenuColumn } from "../types/navigation"

interface SubmenuProps {
  columns: SubmenuColumn[]
  isVisible: boolean
  onClose: () => void
  onMouseEnter?: () => void
  top?: number
}

export function Submenu({ columns, isVisible, onClose, onMouseEnter, top = 0 }: SubmenuProps) {
  if (!isVisible) return null

  // If there's only one category, spread items horizontally
  const isSingleCategory = columns.length === 1

  return (
    <div
      className="ml-2 pointer-events-auto visible opacity-100 transition-opacity duration-150 fixed z-50 w-[calc(100vw-2rem)] lg:w-[640px] bg-[oklch(0.24_0_0)] text-white shadow-xl rounded-md border border-white/10"
      role="menu"
      onMouseEnter={() => {
        // Cancel any pending close timeouts when hovering over submenu
        if (onMouseEnter) {
          onMouseEnter()
        }
      }}
      onMouseLeave={(e) => {
        // Close when mouse leaves submenu, unless moving back to sidebar
        const relatedTarget = e.relatedTarget
        
        // relatedTarget can be Window, HTMLElement, or null
        if (relatedTarget instanceof HTMLElement) {
          const isMovingToSidebar = relatedTarget.closest('nav') !== null || 
                                   relatedTarget.closest('.top-0.h-screen') !== null
          
          // Close if not moving to sidebar
          if (!isMovingToSidebar) {
            onClose()
          }
        } else {
          // relatedTarget is Window or null - mouse is leaving to main content
          onClose()
        }
      }}
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
            {columns[0].links.map((link) => (
              <li key={link.href} style={{ flexBasis: 'calc(25% - 1.125rem)', minWidth: 0 }}>
                <Link 
                  className="hover:underline cursor-pointer block" 
                  href={link.href}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              </li>
            ))}
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
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      className="hover:underline cursor-pointer" 
                      href={link.href}
                      onClick={onClose}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

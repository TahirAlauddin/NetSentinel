"use client"

import { SubmenuColumn } from "../types/navigation"

interface SubmenuProps {
  columns: SubmenuColumn[]
  isVisible: boolean
  onClose: () => void
  top?: number
}

export function Submenu({ columns, isVisible, onClose, top = 0 }: SubmenuProps) {
  if (!isVisible) return null

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
      <div className="grid grid-cols-3 gap-6 p-6 text-sm">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="mb-3 font-medium text-[oklch(0.85_0_0)]">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a 
                    className="hover:underline cursor-pointer" 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      // Handle link click here
                    }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

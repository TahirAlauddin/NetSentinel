import { LucideIcon } from "lucide-react"

export interface SubmenuColumn {
  title?: string
  links: string[]
}

export interface NavigationItem {
  label: string
  icon: LucideIcon
  href: string
  active?: boolean
  hasSubmenu?: boolean
  submenuColumns?: SubmenuColumn[]
}

export interface SidebarProps {
  onClose?: () => void
}

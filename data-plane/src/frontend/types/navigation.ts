import { LucideIcon } from "lucide-react"

export interface SubmenuLink {
  label: string
  href: string
}

export interface SubmenuColumn {
  title?: string
  links: SubmenuLink[]
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

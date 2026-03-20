import { LucideIcon } from "lucide-react"

export interface SubmenuLink {
  label: string
  href: string
  /** If set, user must have this Django permission to see the link (RBAC). */
  requiredPermission?: string
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
  /** If set, user must have this Django permission to see the item (RBAC). */
  requiredPermission?: string
}

export interface SidebarProps {
  onClose?: () => void
}

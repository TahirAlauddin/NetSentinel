"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu, ChevronsRight } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useSidebarOptional } from "@/contexts/sidebar-context"

export function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { data: session } = useSession()
  const sidebar = useSidebarOptional()


  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  // Use username first, then name, then fallback
  const displayName = session?.user?.username || 'User'
  
  return (
    <div className="w-full bg-[oklch(0.24_0_0)] text-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex items-center justify-between h-12 text-sm">
          <div className="flex items-center gap-2">
            {sidebar?.isCollapsed && (
              <button
                type="button"
                onClick={sidebar.toggleCollapsed}
                className="hidden lg:flex p-2 hover:bg-white/10 rounded-md transition-colors"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[oklch(0.85_0_0)]">Welcome:</span>
            <span className="font-medium">{displayName}</span>
            {session?.user?.isStaff && (
              <span className="px-2 py-1 text-xs bg-yellow-600 rounded">Admin</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            {session ? (
              <button 
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-red-500 text-white hover:opacity-90 cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <Link href="/login" className="px-3 py-1 rounded bg-red-500 text-white hover:opacity-90 cursor-pointer">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

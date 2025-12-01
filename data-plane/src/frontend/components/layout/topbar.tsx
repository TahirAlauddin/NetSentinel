"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Menu, X } from "lucide-react"

export function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [now, setNow] = useState<string>("")
  const { data: session } = useSession()

  useEffect(() => {
    function tick() {
      const d = new Date()
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d)
      const date = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d)
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(d)
      setNow(`${weekday}, ${date}  ${time}`)
    }
    tick()
    const id = setInterval(tick, 1000 * 30)
    return () => clearInterval(id)
  }, [])

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
            {/* Mobile hamburger menu */}
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
          <div className="flex items-center gap-4">
            <span className="hidden sm:block">{now}</span>
            {session ? (
              <button 
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <Link href="/login" className="px-3 py-1 rounded bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 cursor-pointer">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

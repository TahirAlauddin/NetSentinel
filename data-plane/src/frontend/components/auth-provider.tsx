"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"

function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signOut({ redirect: true })
    }
  }, [session])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionErrorHandler>             
        {children}
      </SessionErrorHandler>
    </SessionProvider>
  )
}

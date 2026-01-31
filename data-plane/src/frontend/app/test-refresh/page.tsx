"use client"

import { notFound } from "next/navigation"
import { RefreshTokenTest } from "@/components/refresh-token-test"

export default function TestRefreshPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RefreshTokenTest />
    </div>
  )
}

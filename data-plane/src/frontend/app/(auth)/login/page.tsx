"use client"

import Image from "next/image"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  // Use callbackUrl from NextAuth, fallback to redirect param, then default to dashboard
  const callbackUrl = searchParams.get('callbackUrl')
  const redirectParam = searchParams.get('redirect')
  
  // Extract pathname from callbackUrl if it's a full URL
  let redirectUrl = "/dashboard"
  if (callbackUrl) {
    try {
      const url = new URL(callbackUrl, window.location.origin)
      redirectUrl = url.pathname + url.search
    } catch {
      // If it's not a full URL, use it as-is (it's already a path)
      redirectUrl = callbackUrl
    }
  } else if (redirectParam) {
    redirectUrl = redirectParam
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    if (!username || !password) {
      setError("Please enter both username and password.")
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid username or password.")
      } else {
        router.push(redirectUrl)
      }
    } catch (error) {
      setError("Server error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Visual panel using the provided image */}
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <Image
            src="/NetSentinel-Logo.png"
            alt="NetSentinel Logo"
            width={180}
            height={180}
            priority
          />
          <span className="mt-8 text-4xl font-bold text-white tracking-wide">NetSentinel</span>
        </div>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Sign in to NetSentinel</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue.</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <label htmlFor="username" className="text-sm">
              Username
            </label>
            <input
              id="username"
              name="username"
              required
              disabled={isLoading}
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="Username"
            />
            
            <label htmlFor="password" className="text-sm">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <div className="ml-4 text-lg">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
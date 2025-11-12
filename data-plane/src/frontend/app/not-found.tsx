'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header with breadcrumb */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <span>Page</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">404</span>
          </div>

          {/* Main 404 Content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-foreground tracking-tight">
                404
              </h1>
              <p className="text-2xl text-foreground font-semibold">
                Page not found
              </p>
            </div>

            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
          </div>

          {/* Decorative element */}
          <div className="my-12 flex justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-border flex items-center justify-center opacity-20">
              <div className="w-24 h-24 rounded-full border-2 border-border" />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              <Home className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground rounded-full font-medium hover:bg-muted transition-colors"
            >
              Go to Settings
            </Link>
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Check out our{' '}
            <a href="#" className="text-primary hover:underline">
              documentation
            </a>{' '}
            or{' '}
            <a href="#" className="text-primary hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground mb-4">Unauthorized</h2>
        <p className="text-muted-foreground mb-8">
          You don&apos;t have permission to access this resource.
        </p>
        <Link 
          href="/dashboard" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

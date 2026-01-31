import { AppShell } from "@/components/layout/app-shell"
import { getSafeRedirectPath } from "@/lib/security/redirect"

interface AuthRequiredStateProps {
  message?: string
  loginUrl?: string
  loginText?: string
}

export function AuthRequiredState({
  message = "Please log in to access settings",
  loginUrl = "/login",
  loginText = "Go to Login"
}: AuthRequiredStateProps) {
  const safeLoginHref = getSafeRedirectPath(loginUrl) ?? "/login"

  return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">{message}</div>
          <a href={safeLoginHref} className="text-primary hover:underline">{loginText}</a>
        </div>
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/app-shell"

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
  return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">{message}</div>
          <a href={loginUrl} className="text-primary hover:underline">{loginText}</a>
        </div>
      </div>
    </AppShell>
  )
}

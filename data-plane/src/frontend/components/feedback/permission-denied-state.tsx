import { AppShell } from "@/components/layout/app-shell"

interface PermissionDeniedStateProps {
  message?: string
  description?: string
}

export function PermissionDeniedState({ 
  message = "You don't have permission to access user management",
  description = "Only superusers can manage users"
}: PermissionDeniedStateProps) {
  return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">{message}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
    </AppShell>
  )
}

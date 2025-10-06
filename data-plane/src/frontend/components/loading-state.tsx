import { AppShell } from "@/components/app-shell"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{message}</div>
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/layout/app-shell"
import { DashboardContent } from "@/components/dashboard-content"
import { ProtectedRoute } from "@/components/feedback/protected-route"

export default async function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  )
}

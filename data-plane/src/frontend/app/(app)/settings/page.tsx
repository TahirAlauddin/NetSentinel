import { AppShell } from "@/components/layout/app-shell"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsOverview } from "@/components/settings/settings-overview"

export default async function SettingsPage() {

  return (
    <AppShell>
      <div className="min-h-[calc(100dvh-120px)]">
        {/* Main content */}
        <div className="p-8">
          <div className="space-y-6">
            <SettingsHeader currentPage="Overview" showCompanyManagement={true} />

            {/* Overview content */}
            <SettingsOverview />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

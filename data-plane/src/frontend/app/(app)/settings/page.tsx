import { AppShell } from "@/components/app-shell"
import { SettingsSidebar } from "@/components/settings-sidebar"
import { SettingsNavTabs } from "@/components/settings-nav-tabs"
import { SettingsHeader } from "@/components/settings-header"
import { SettingsOverview } from "@/components/settings-overview"

export default async function SettingsPage() {

  return (
    <AppShell>
      <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
        <SettingsSidebar />

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="space-y-6">
            <SettingsHeader currentPage="Overview" showCompanyManagement={true} />
            <SettingsNavTabs />

            {/* Overview content */}
            <SettingsOverview />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

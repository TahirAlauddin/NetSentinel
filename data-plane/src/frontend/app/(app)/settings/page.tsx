import { AppShell } from "@/components/layout/app-shell"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsOverview } from "@/components/settings/settings-overview"
import { getCompanyProfile } from "./actions/company-profile"

/**
 * Settings page for the app.
 * This overview page displays the company profile and allows the user to edit it.
 */
export default async function SettingsPage() {
  const companyData = await getCompanyProfile()

  return (
    <AppShell>
      <div className="min-h-[calc(100dvh-120px)]">
        {/* Main content */}
        <div className="p-8">
          <div className="space-y-6">
            <SettingsHeader currentPage="Overview" showCompanyManagement={true} />

            {/* Overview content */}
            <SettingsOverview companyData={companyData} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

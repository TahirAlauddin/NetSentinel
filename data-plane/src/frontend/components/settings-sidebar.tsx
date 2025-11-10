import Link from "next/link";

/**
 * Settings Sidebar component
 * This component is used to display the settings sidebar in the settings page.
 * It contains the main settings, additional settings, and data settings.
 * Settings, People, Groups & Permissions, Child Company Management, Feature Requests, Logs, Export Data, Import Data.
 * @returns {JSX.Element}
 */
export function SettingsSidebar() {
  return (
    <aside className="w-56 bg-[oklch(0.96_0_0)] p-6 border-r border-border">
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Main
          </div>
          <nav className="space-y-1">
            <Link
              href="/settings"
              className="block px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              Settings
            </Link>
            <Link
              href="/settings/people"
              className="block px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              People
            </Link>
            <Link
              href="/settings/groups"
              className="block px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              Groups & Permissions
            </Link>
          </nav>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Additional
          </div>
          <nav className="space-y-1">
            <Link
              href="/settings/company"
              className="block px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              Child Company Management
            </Link>
            <Link
              href="/settings/requests"
              className="block px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              Feature Requests
            </Link>
            <Link
              href="/settings/logs"
              className="block px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              Logs
            </Link>
          </nav>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Data
          </div>
          <nav className="space-y-1">
            <Link
              href="/settings/export"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              <span>Export Data</span>
              <span className="text-muted-foreground">›</span>
            </Link>
            <Link
              href="/settings/import"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-[oklch(0.93_0_0)]"
            >
              <span>Import Data</span>
              <span className="text-muted-foreground">›</span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}


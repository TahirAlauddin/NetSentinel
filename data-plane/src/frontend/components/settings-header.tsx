interface SettingsHeaderProps {
  currentPage: string;
  showCompanyManagement?: boolean;
}

/**
 * Settings Header component
 * This component is used to display the settings header in the settings page.
 * It contains the current page and optionally the company management in Breadcrumb format. 
 * @param {SettingsHeaderProps} props - The props for the SettingsHeader component.
 * @param {string} props.currentPage - The current page.
 * @param {boolean} props.showCompanyManagement - Whether to show "Company Management" (default: false).
 * @returns {JSX.Element}
 */
export function SettingsHeader({ currentPage, showCompanyManagement = false }: SettingsHeaderProps) {
  return (
    <div className="space-y-4">
      {showCompanyManagement && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Company Management</span>
          <span>›</span>
          <span>{currentPage}</span>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold">
          {showCompanyManagement ? "Company Management" : currentPage}
        </h1>
      </div>
    </div>
  );
}


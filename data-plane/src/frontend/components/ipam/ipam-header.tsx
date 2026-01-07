import Link from "next/link";

interface IpamHeaderProps {
  currentPage: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

/**
 * IPAM Header component
 * This component displays the IPAM page header with breadcrumbs and title.
 * @param {IpamHeaderProps} props - The props for the IpamHeader component.
 * @param {string} props.currentPage - The current page title.
 * @param {Array<{label: string; href?: string}>} props.breadcrumbs - Optional breadcrumb trail.
 * @returns {JSX.Element}
 */
export function IpamHeader({ currentPage, breadcrumbs }: IpamHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {crumb.href ? (
                <Link href={crumb.href} className="hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span>›</span>}
            </div>
          ))}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold">{currentPage}</h1>
      </div>
    </div>
  );
}


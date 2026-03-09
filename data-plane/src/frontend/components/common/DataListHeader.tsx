import type { ReactNode } from "react";

interface DataListHeaderProps {
  title?: ReactNode;
  headerActions?: ReactNode;
}

export function DataListHeader({ title, headerActions }: DataListHeaderProps) {
  if (title == null && headerActions == null) return null;
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      {title != null && (
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      )}
      {headerActions != null && (
        <div className="flex items-center gap-2">{headerActions}</div>
      )}
    </div>
  );
}
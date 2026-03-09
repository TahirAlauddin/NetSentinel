import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataListToolbarProps {
  searchable?: boolean;
  searchPlaceholder?: string;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  canShowViewToggle: boolean;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  pagination?: boolean;
  itemsPerPage: number;
  onPageSizeChange: (v: string) => void;
  pageSizeOptions: number[];
}

export function DataListToolbar({
  searchable,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  canShowViewToggle,
  viewMode,
  onViewModeChange,
  pagination,
  itemsPerPage,
  onPageSizeChange,
  pageSizeOptions,
}: DataListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {searchable && (
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full sm:w-64"
              aria-label="Search"
            />
          </div>
        )}
        {canShowViewToggle && (
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        )}
      </div>
      {pagination && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Per page
          </span>
          <Select value={String(itemsPerPage)} onValueChange={onPageSizeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
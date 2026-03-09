import { ListView } from "@/components/ui/list-view";
import { GridView } from "@/components/ui/grid-view";
import type { ViewMode } from "@/components/ui/view-toggle";
import type { ListItemBase, ListColumn, ListGridItem, ListSortDirection } from "./DataListTypes";

interface DataListContentProps<T extends ListItemBase> {
  loading?: boolean;
  loadingMessage?: string;
  viewMode: ViewMode;
  gridItems: ListGridItem<T>[];
  paginatedData: T[];
  columns: ListColumn<T>[];
  gridColumns?: 1 | 2 | 3 | 4 | 5 | 6;
  emptyMessage?: string;
  cardClassName?: string | ((item: T, index: number) => string);
  rowClassName?: (item: T, index: number) => string;
  sortField: string | null;
  sortDirection: ListSortDirection;
  handleSort: (field: string) => void;
  onRowClick?: (item: T) => void;
  onItemClick?: (item: T) => void;
}

export function DataListContent<T extends ListItemBase>({
  loading,
  loadingMessage,
  viewMode,
  gridItems,
  paginatedData,
  columns,
  gridColumns,
  emptyMessage,
  cardClassName,
  rowClassName,
  sortField,
  sortDirection,
  handleSort,
  onRowClick,
  onItemClick,
}: DataListContentProps<T>) {
  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">{loadingMessage}</div>;
  }

  if (viewMode === "list") {
    return (
      <div className="overflow-x-auto rounded-md border">
        <ListView<T>
          data={paginatedData}
          columns={columns}
          onSort={handleSort}
          sortField={sortField ?? undefined}
          sortDirection={sortDirection}
          emptyMessage={emptyMessage}
          rowClassName={rowClassName}
          onRowClick={onRowClick}
        />
      </div>
    );
  }

  if (gridItems.length > 0) {
    return (
      <GridView<T>
        data={paginatedData}
        items={gridItems}
        columns={gridColumns}
        emptyMessage={emptyMessage}
        cardClassName={cardClassName}
        onItemClick={onItemClick}
      />
    );
  }

  return (
    <ListView<T>
      data={paginatedData}
      columns={columns}
      onSort={handleSort}
      sortField={sortField ?? undefined}
      sortDirection={sortDirection}
      emptyMessage={emptyMessage}
      rowClassName={rowClassName}
      onRowClick={onRowClick}
    />
  );
}
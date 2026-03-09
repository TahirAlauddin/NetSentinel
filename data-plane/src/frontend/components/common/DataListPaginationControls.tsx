import { Button } from "@/components/ui/button";

interface DataListPaginationControlsProps {
  hasPagination?: boolean;
  startItem: number;
  endItem: number;
  totalItems: number;
  pageIndex: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function DataListPaginationControls({
  hasPagination,
  startItem,
  endItem,
  totalItems,
  pageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
}: DataListPaginationControlsProps) {
  if (!hasPagination) return null;
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t">
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        Showing {startItem} to {endItem} of {totalItems} items
      </div>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={pageIndex <= 1}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground min-w-[100px] text-center">
          Page {pageIndex} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={pageIndex >= totalPages}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
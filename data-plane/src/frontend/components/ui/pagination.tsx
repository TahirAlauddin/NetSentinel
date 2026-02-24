"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  /** 1-based current page */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** 1-based index of first item on current page */
  pageStart: number;
  /** 1-based index of last item on current page */
  pageEnd: number;
  /** Called with the new page number (1-based) */
  onPageChange: (page: number) => void;
  /** Label for the item count, e.g. "assets" → "Showing 1 to 10 of 42 assets" */
  itemLabel?: string;
  /** Optional class name for the root container */
  className?: string;
}

/**
 * Pagination controls with range summary and Previous/Next buttons.
 * Renders nothing when totalPages is 0 or 1.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageStart,
  pageEnd,
  onPageChange,
  itemLabel = "items",
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={className}
      role="navigation"
      aria-label="Pagination"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {pageStart} to {pageEnd} of {totalItems} {itemLabel}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground min-w-[100px] text-center">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

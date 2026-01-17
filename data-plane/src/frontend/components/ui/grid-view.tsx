"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface GridItem<T> {
  key: string;
  label?: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
}

interface GridViewProps<T> {
  data: T[];
  items: GridItem<T>[];
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
  cardClassName?: string | ((item: T, index: number) => string);
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  onItemClick?: (item: T) => void;
}

/**
 * GridView Component
 * Generic grid/card view component for displaying data in a card grid format
 */
export function GridView<T extends { id?: number | string }>({
  data,
  items,
  emptyMessage = "No items available",
  loading = false,
  loadingMessage = "Loading...",
  className,
  cardClassName,
  columns = 3,
  onItemClick,
}: GridViewProps<T>) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">{loadingMessage}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {data.map((item, index) => {
        const cardClass = typeof cardClassName === "function"
          ? cardClassName(item, index)
          : cardClassName;

        return (
          <Card
            key={item.id ?? index}
            className={cn(
              "p-4 hover:shadow-md transition-shadow",
              onItemClick && "cursor-pointer",
              cardClass
            )}
            onClick={() => onItemClick?.(item)}
          >
            <div className="space-y-2">
              {items.map((gridItem) => (
                <div key={gridItem.key} className={cn(gridItem.className)}>
                  {gridItem.label && (
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      {gridItem.label}
                    </div>
                  )}
                  <div>{gridItem.render(item, index)}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

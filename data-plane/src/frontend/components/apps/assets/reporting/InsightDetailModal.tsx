"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Asset } from "@/types/assets";
import { InsightDetailContent } from "./InsightDetailContent";
import { MoreHorizontal, Upload, X } from "lucide-react";

export interface InsightDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  distribution: Array<{ name: string; value: number; assets: Asset[] }>;
  totalLabel: string;
  onExport?: () => void;
}

/**
 * Modal that shows insight detail: chart, distribution list, and assets table.
 * Use instead of navigating to nested reporting URLs.
 */
export function InsightDetailModal({
  open,
  onOpenChange,
  title,
  distribution,
  totalLabel,
  onExport,
}: InsightDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-2rem)] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b px-6 py-4 shrink-0">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
            {onExport && (
              <Button size="sm" onClick={onExport} className="gap-2">
                <Upload className="h-4 w-4" />
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-4">
          <InsightDetailContent
            title={title}
            distribution={distribution}
            totalLabel={totalLabel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

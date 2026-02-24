"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Asset } from "@/types/assets";
import { AssetsDashboardNav } from "@/components/apps/assets/AssetsDashboardNav";
import { InsightDetailContent } from "./InsightDetailContent";
import { X } from "lucide-react";

interface InsightDetailPageProps {
  title: string;
  distribution: Array<{ name: string; value: number; assets: Asset[] }>;
  totalLabel: string;
  onExport?: () => void;
}

/**
 * Full-page wrapper for insight detail (used by nested routes e.g. /assets/reporting/location).
 * For modal experience, use InsightDetailModal from the main reporting page.
 */
export function InsightDetailPage({
  title,
  distribution,
  totalLabel,
  onExport,
}: InsightDetailPageProps) {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-auto bg-muted/30">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <AssetsDashboardNav />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="sr-only">More options</span>
            </Button>
            {onExport && (
              <Button size="sm" onClick={onExport}>
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <InsightDetailContent
          title={title}
          distribution={distribution}
          totalLabel={totalLabel}
        />
      </div>
    </div>
  );
}

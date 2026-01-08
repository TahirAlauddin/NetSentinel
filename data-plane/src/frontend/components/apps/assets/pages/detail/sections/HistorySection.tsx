"use client";

import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Asset } from "@/types/assets";

interface HistorySectionProps {
  asset: Asset;
}

export function HistorySection({ asset }: HistorySectionProps) {
  // TODO: Map asset.created_at to asset.createdAt if needed
  const createdAt = (asset as Asset & { createdAt?: string }).createdAt || asset.created_at || "";

  return (
    <section id="history">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
      <Card className="p-4 md:p-6">
        <div className="flex justify-end mb-4">
          <select className="border rounded px-2 py-1 text-sm">
            <option>25 per page</option>
            <option>50 per page</option>
            <option>100 per page</option>
          </select>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 truncate">{asset.name} created</p>
          </div>
          <div className="text-sm text-gray-500 whitespace-nowrap">{createdAt}</div>
        </div>
      </Card>
    </section>
  );
}


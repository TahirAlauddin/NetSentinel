"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Asset } from "@/types/assets";

interface SourcesSectionProps {
  asset: Asset;
}

export function SourcesSection({ asset }: SourcesSectionProps) {
  const [sourcesTab, setSourcesTab] = useState<"summary" | "manual">("summary");

  return (
    <section id="sources">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Sources</h2>
      <Card className="p-4 md:p-6">
        <div className="flex gap-2 md:gap-4 mb-4">
          <button
            onClick={() => setSourcesTab("summary")}
            className={`px-3 md:px-4 py-2 text-sm rounded-lg ${
              sourcesTab === "summary"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setSourcesTab("manual")}
            className={`px-3 md:px-4 py-2 text-sm rounded-lg ${
              sourcesTab === "manual"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Manually Added
          </button>
        </div>

        <h3 className="font-medium text-gray-900 mb-4">General Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {[
            { label: "Name", value: asset.name },
            { label: "Company Asset Status Id", value: "37534" },
            { label: "Useful Life", value: "0" },
            { label: "Approaching End Of Life", value: "0" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{item.label}</span>
              <span className="text-gray-400">—</span>
              <span className="text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}


"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Asset } from "@/types/assets";
import { deprecationData } from "../../constants/asset-detail";

interface CostDepreciationSectionProps {
  asset: Asset;
  onEdit: () => void;
}

export function CostDepreciationSection({ asset, onEdit }: CostDepreciationSectionProps) {
  const costDepreciation = {
    purchasePrice: asset.purchase_price || undefined,
    replacementCost: asset.replacement_cost || undefined,
    salvageValue: asset.salvage_value || undefined,
    usefulLife: asset.useful_life_years || undefined,
    approachingEndOfLife: asset.approaching_eol_months || undefined,
    poNumber: asset.po_number || undefined,
  };

  return (
    <section id="cost-depreciation">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cost & Depreciation</h2>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-3 md:space-y-4">
            {[
              {
                label: "Purchase Price",
                value: costDepreciation.purchasePrice,
                action: "Add cost data",
              },
              {
                label: "Replacement Cost",
                value: costDepreciation.replacementCost,
                action: "Add replacement cost",
              },
              {
                label: "Salvage Value",
                value: costDepreciation.salvageValue,
                action: "Add salvage data",
              },
              {
                label: "Useful Life",
                value: costDepreciation.usefulLife,
                action: "Add useful life",
                suffix: " years",
              },
              {
                label: "Approaching End-of-Life",
                value: costDepreciation.approachingEndOfLife,
                action: "Add approaching end-of-life",
                suffix: " months",
              },
              { label: "PO#", value: costDepreciation.poNumber, action: "Add PO#" },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">{item.label}</span>
                {item.value !== undefined ? (
                  <span className="text-gray-900 text-sm">
                    {typeof item.value === "number" && !item.suffix
                      ? `$${item.value.toLocaleString()}`
                      : item.value}
                    {item.suffix || ""}
                  </span>
                ) : (
                  <button className="text-blue-600 text-sm" onClick={onEdit}>
                    {item.action}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="h-48 md:h-auto">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={deprecationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 text-center mt-2">
              Estimated Value (Dollars)
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}


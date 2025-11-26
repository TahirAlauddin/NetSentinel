"use client";

import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface CustomDetailsSectionProps {
  customDetails: Array<{ key: string; value: string }>;
  onAdd: () => void;
}

export function CustomDetailsSection({ customDetails, onAdd }: CustomDetailsSectionProps) {
  return (
    <section id="custom-details">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Details</h2>
      <Card className="p-4 md:p-6">
        {customDetails.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-900 font-medium mb-2">
              Not tracking anything here, yet.
            </p>
            <button
              className="text-blue-600 flex items-center gap-1 mx-auto"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4" />
              Add some details
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {customDetails.map((detail, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-500">{detail.key}</span>
                <span className="text-gray-900">{detail.value}</span>
              </div>
            ))}
            <button
              className="text-blue-600 text-sm flex items-center gap-1 mt-2"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4" />
              Add another
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}


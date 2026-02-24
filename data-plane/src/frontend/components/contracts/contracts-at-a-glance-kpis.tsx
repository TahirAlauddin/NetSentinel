"use client";

import { AT_GLANCE_LABELS } from "@/lib/contracts/constants";
import type { ContractOverviewResponse } from "@/types/contracts";

interface ContractsAtAGlanceKpisProps {
  atGlance: ContractOverviewResponse["at_glance"];
  loading?: boolean;
}

export function ContractsAtAGlanceKpis({
  atGlance,
  loading = false,
}: ContractsAtAGlanceKpisProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">At a glance</h2>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
          {AT_GLANCE_LABELS.map(({ label }) => (
            <div
              key={label}
              className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse"
            >
              <div className="text-base text-gray-400 mb-2">{label}</div>
              <div className="text-4xl text-gray-300">—</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
          {AT_GLANCE_LABELS.map(({ key, label, color }) => (
            <div
              key={key}
              className="bg-white rounded-lg p-6 border border-gray-200"
            >
              <div className="text-base text-gray-600 mb-2">{label}</div>
              <div className={`text-4xl ${color}`}>{atGlance[key]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

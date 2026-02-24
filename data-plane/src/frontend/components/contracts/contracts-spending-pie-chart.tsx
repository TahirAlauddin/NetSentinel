"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { formatContractCurrency } from "@/lib/contracts/utils";
import type { ContractOverviewResponse } from "@/types/contracts";

interface ContractsSpendingPieChartProps {
  data: ContractOverviewResponse["spending_by_category"];
  totalSpend: number;
  loading?: boolean;
}

export function ContractsSpendingPieChart({
  data,
  totalSpend,
  loading = false,
}: ContractsSpendingPieChartProps) {
  return (
    <div className="min-w-0">
      <h3 className="text-base text-gray-600 mb-6">Spending by category</h3>
      <div
        className="relative flex items-center justify-center"
        style={{ height: 350 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={100}
              outerRadius={140}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          aria-hidden
        >
          <div className="text-2xl font-semibold text-gray-900">
            {loading ? "—" : formatContractCurrency(totalSpend)}
          </div>
          <div className="text-base text-gray-600 mt-1">
            Contracts Spend (annual)
          </div>
        </div>
      </div>
    </div>
  );
}

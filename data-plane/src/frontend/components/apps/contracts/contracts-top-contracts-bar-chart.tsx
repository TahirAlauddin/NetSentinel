"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import type { ContractOverviewResponse } from "@/types/contracts";

interface ContractsTopContractsBarChartProps {
  data: ContractOverviewResponse["top_contracts"];
}

export function ContractsTopContractsBarChart({
  data,
}: ContractsTopContractsBarChartProps) {
  const domainMax = (() => {
    const vals = data.map((c) => c.value);
    const max = vals.length ? Math.max(...vals) : 1;
    return max * 1.1;
  })();

  return (
    <div className="min-w-0 min-h-[360px]">
      <h3 className="text-base text-gray-600 mb-6">Top 5 active contracts</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 12, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            horizontal
            vertical={false}
          />
          <XAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={false}
          />
          <YAxis
            dataKey="value"
            type="number"
            label={{
              value: "Total value (USD)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fontSize: 11 },
            }}
            domain={[0, domainMax]}
            tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={false}
            width={80}
            tickMargin={8}
          />
          <Tooltip
            formatter={(value: number) =>
              `$${Number(value).toLocaleString()}`
            }
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          >
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

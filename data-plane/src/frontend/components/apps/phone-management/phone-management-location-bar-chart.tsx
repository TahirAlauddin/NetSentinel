"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { LocationBarItem } from "@/lib/phone-management/overview";

interface PhoneManagementLocationBarChartProps {
  data: LocationBarItem[];
  loading?: boolean;
}

export function PhoneManagementLocationBarChart({
  data,
  loading = false,
}: PhoneManagementLocationBarChartProps) {
  if (loading) {
    return (
      <div className="min-w-0 min-h-[340px]">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Top locations (managed numbers)
        </h3>
        <div
          className="flex items-center justify-center text-muted-foreground"
          style={{ height: 320 }}
        >
          —
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="min-w-0 min-h-[340px]">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Top locations (managed numbers)
        </h3>
        <div
          className="flex items-center justify-center text-muted-foreground"
          style={{ height: 320 }}
        >
          No data
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 min-h-[340px]">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Top locations (managed numbers)
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          layout="vertical"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
            vertical
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(value: number) => [value, "Numbers"]} />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={32}
            fill="hsl(var(--primary))"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ServiceTypeSlice } from "@/lib/phone-management/overview";

interface PhoneManagementServiceTypePieChartProps {
  data: ServiceTypeSlice[];
  totalNumbers: number;
  loading?: boolean;
}

export function PhoneManagementServiceTypePieChart({
  data,
  totalNumbers,
  loading = false,
}: PhoneManagementServiceTypePieChartProps) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        By service type
      </h3>
      <div
        className="relative flex items-center justify-center"
        style={{ height: 320 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, "Count"]} />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          aria-hidden
        >
          <div className="text-2xl font-semibold text-foreground">
            {loading ? "—" : totalNumbers}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Total numbers
          </div>
        </div>
      </div>
    </div>
  );
}

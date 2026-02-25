"use client";

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Subnet } from "@/types/ipam";

interface SubnetUsageChartProps {
  subnet: Subnet;
}

/**
 * Calculate total IP addresses in a subnet from CIDR notation
 */
function calculateTotalIPs(cidr: string, isIPv6: boolean): number {
  const parts = cidr.split("/");
  if (parts.length !== 2) return 0;
  
  const prefixLength = parseInt(parts[1]);
  if (isNaN(prefixLength)) return 0;
  
  // For IPv4: 2^(32 - prefixLength)
  // For IPv6: 2^(128 - prefixLength)
  const addressBits = isIPv6 ? 128 : 32;
  return Math.pow(2, addressBits - prefixLength);
}

/**
 * Subnet Usage Chart Component
 * Displays a pie chart showing used vs free IP addresses in a subnet
 */
export function SubnetUsageChart({ subnet }: SubnetUsageChartProps) {
  const totalIPs = calculateTotalIPs(subnet.network, subnet.is_ipv6);
  const usedIPs = subnet.ip_addresses_count || 0;
  const freeIPs = Math.max(0, totalIPs - usedIPs);
  const usagePercentage = totalIPs > 0 ? ((usedIPs / totalIPs) * 100).toFixed(2) : "0.00";

  const chartData = [
    { name: "Used", value: usedIPs, color: "oklch(0.40_0.15_249)" },
    { name: "Free", value: freeIPs, color: "oklch(0.93_0_0)" },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Usage Graph</h3>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-xs mb-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), ""]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold">{usagePercentage}%</div>
          <div className="text-sm text-muted-foreground">Usage</div>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[oklch(0.93_0_0)] border border-border"></div>
            <span className="text-sm">Free: {freeIPs.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[oklch(0.40_0.15_249)]"></div>
            <span className="text-sm">Used: {usedIPs.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Total: {totalIPs.toLocaleString()} IPs
        </div>
      </div>
    </Card>
  );
}


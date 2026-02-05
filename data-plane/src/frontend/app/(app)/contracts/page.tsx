"use client";

import { Search, SlidersHorizontal, Plus } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Link from "next/link";

const atGlanceData = [
  { label: "Total", value: 23, color: "text-gray-900" },
  { label: "Active", value: 22, color: "text-green-600" },
  { label: "Expired", value: 0, color: "text-gray-400" },
  { label: "Expiring < 30 days", value: 0, color: "text-gray-400" },
  { label: "Expiring < 60 days", value: 1, color: "text-blue-600" },
  { label: "Expiring < 90 days", value: 1, color: "text-blue-600" },
  { label: "Monthly", value: 0, color: "text-gray-400" },
];

const pieData = [
  { name: "IT and Security", value: 3, color: "#10b981" },
  { name: "Marketing", value: 2, color: "#3b82f6" },
  { name: "Telecom", value: 3, color: "#f59e0b" },
  { name: "Product and Design", value: 1, color: "#ec4899" },
  { name: "Cloud", value: 1, color: "#8b5cf6" },
  { name: "Other", value: 2, color: "#6366f1" },
];

const barData = [
  { name: "Azure", value: 195254, color: "#93c5fd" },
  { name: "Agreement Manag.", value: 82560, color: "#2563eb" },
  { name: "Email Marketing", value: 64800, color: "#14b8a6" },
  { name: "CoPilot", value: 57600, color: "#5eead4" },
  { name: "Project Managem.", value: 54120, color: "#99f6e4" },
];

const categories = [
  { name: "Advertising", count: 1 },
  { name: "Analytics", count: 0 },
  { name: "Cloud", count: 1 },
  { name: "Customer Support", count: 1 },
  { name: "Developer Tools", count: 2 },
  { name: "DevOps", count: 0 },
  { name: "Facilities", count: 1 },
  { name: "Finance and Accounting", count: 1 },
  { name: "General", count: 2 },
  { name: "HR", count: 1 },
  { name: "Infrastructure", count: 0 },
  { name: "IT and Security", count: 3 },
  { name: "Marketing", count: 2 },
  { name: "Onboarding/Offboarding", count: 0 },
  { name: "Other", count: 0 },
  { name: "Product and Design", count: 1 },
  { name: "Productivity", count: 2 },
  { name: "Sales and Business", count: 1 },
  { name: "Telecom", count: 3 },
  { name: "Uncategorized", count: 0 },
];

export default function ContractOverview() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="text-base text-gray-500">Contracts</div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl mb-4">Contract Management</h1>
            <div className="flex items-center gap-3 text-base">
              <div className="flex gap-6">
                <button className="px-5 py-2.5 bg-gray-900 text-white text-base rounded">
                  Overview
                </button>
                <Link
                  href="/contracts/list"
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-900 text-base"
                >
                  All Contracts
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 border border-gray-300 rounded text-base flex items-center gap-3 hover:bg-gray-50">
              <Search className="w-5 h-5" />
              Discover
            </button>
            <Link
              href="/contracts/new"
              className="px-6 py-3 bg-blue-600 text-white rounded text-base flex items-center gap-3 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Contract
            </Link>
          </div>
        </div>

        {/* At a glance */}
        <div className="mb-8">
          <h2 className="text-2xl mb-6">At a glance</h2>
          <div className="grid grid-cols-7 gap-6">
            {atGlanceData.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-lg p-6 border border-gray-200"
              >
                <div className="text-base text-gray-600 mb-2">{item.label}</div>
                <div className={`text-4xl ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl">Category breakdown</h2>
            <button className="text-base text-gray-600 flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded">
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>

          <div className="grid grid-cols-[1fr_1.2fr] gap-12 min-w-0">
            {/* Spending by category */}
            <div className="min-w-0">
              <h3 className="text-base text-gray-600 mb-6">
                Spending by category
              </h3>
              <div className="relative flex items-center justify-center" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label on top of pie so it's never hidden */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
                  aria-hidden
                >
                  <div className="text-3xl font-semibold text-gray-900">$1.07m</div>
                  <div className="text-base text-gray-600 mt-1">Contracts Spend</div>
                </div>
              </div>
            </div>

            {/* Top 5 active contracts - extra space so Y-axis labels are not cut off */}
            <div className="min-w-[360px]">
              <h3 className="text-base text-gray-600 mb-6">
                Top 5 active contracts
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={barData}
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
                    domain={[0, 200000]}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                    ticks={[0, 20000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000]}
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
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Contract categories */}
          <div className="mt-10">
            <h3 className="text-base text-gray-600 mb-6">Contract categories</h3>
            <div className="grid grid-cols-3 gap-x-12 gap-y-3">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between text-base py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-gray-500">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

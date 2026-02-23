"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

// const COLORS = [
//   "oklch(0.696 0.17 162.48)", // teal-like
//   "oklch(0.627 0.265 303.9)", // purple
//   "oklch(0.645 0.246 16.439)", // orange
// ]

const meter75 = [
  { name: "value", value: 75 },
  { name: "rest", value: 25 },
]
const meter60 = [
  { name: "value", value: 60 },
  { name: "rest", value: 40 },
]

const bars = [
  { name: "A", teal: 400, purple: 240, lime: 240 },
  { name: "B", teal: 300, purple: 139, lime: 221 },
  { name: "C", teal: 200, purple: 980, lime: 229 },
  { name: "D", teal: 278, purple: 390, lime: 200 },
  { name: "E", teal: 189, purple: 480, lime: 218 },
]

const barchart = [
  { name: "Q1", teal: 4, orange: 3, purple: 2 },
  { name: "Q2", teal: 2, orange: 2, purple: 2 },
  { name: "Q3", teal: 4, orange: 5, purple: 3 },
  { name: "Q4", teal: 3, orange: 4, purple: 2 },
]

function MetricCard({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{amount}</div>
    </div>
  )
}

export function DashboardContent() {
  return (
    <div className="space-y-6">

      {/* Metric tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="$400K Revenue per Month" amount="$400K" />
        <MetricCard label="$400K Revenue per Month" amount="$400K" />
        <MetricCard label="$400K Revenue per Month" amount="$400K" />
        <MetricCard label="$400K Revenue per Month" amount="$400K" />
      </section>

      {/* Index gauges + horizontal bars */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border border-border bg-card p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Two circular meters */}
            <div className="space-y-2">
              <div className="text-center font-medium">Index One</div>
              <div className="h-32 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meter75}
                      innerRadius={50}
                      outerRadius={65}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      <Cell fill="oklch(0.645 0.246 16.439)" /> {/* orange */}
                      <Cell fill="oklch(0.9 0 0)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-muted-foreground">75%</div>
            </div>

            <div className="space-y-2">
              <div className="text-center font-medium">Index Two</div>
              <div className="h-32 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meter60}
                      innerRadius={50}
                      outerRadius={65}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      <Cell fill="oklch(0.627 0.265 303.9)" /> {/* purple */}
                      <Cell fill="oklch(0.9 0 0)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-muted-foreground">60%</div>
            </div>
          </div>

          {/* Horizontal stacked-ish bars mock */}
          <div className="mt-6 space-y-3">
            {bars.map((b) => (
              <div key={b.name} className="h-6 w-full rounded bg-muted relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[oklch(0.696_0.17_162.48)]"
                  style={{ width: `${(b.teal / 500) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-[oklch(0.827_0.2_136)]"
                  style={{ width: `${(b.lime / 500) * 100}%`, opacity: 0.6 }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-[oklch(0.627_0.265_303.9)]"
                  style={{ width: `${(b.purple / 1600) * 100}%`, opacity: 0.9 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 2025 bar chart */}
        <div className="rounded-md border border-border bg-card p-4 sm:p-6">
          <div className="text-[oklch(0.6_0.118_184.704)] font-semibold mb-2 text-sm sm:text-base">2025 Dashboard Data Chart</div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor congue magna.
          </p>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barchart}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
                <XAxis dataKey="name" stroke="oklch(0.556 0 0)" fontSize={12} />
                <YAxis stroke="oklch(0.556 0 0)" fontSize={12} />
                <Tooltip cursor={{ fill: "oklch(0.97 0 0)" }} />
                <Bar dataKey="teal" fill="oklch(0.696 0.17 162.48)" />
                <Bar dataKey="orange" fill="oklch(0.645 0.246 16.439)" />
                <Bar dataKey="purple" fill="oklch(0.627 0.265 303.9)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}

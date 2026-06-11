"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Period = "7D" | "30D" | "90D"
type ChartMode = "throughput" | "quality"
type SeriesKey = "voice" | "data" | "iot"

const periodOptions: Period[] = ["7D", "30D", "90D"]

const throughputByPeriod: Record<
  Period,
  Array<{
    label: string
    voice: number
    data: number
    iot: number
    latency: number
    successRate: number
  }>
> = {
  "7D": [
    { label: "Mon", voice: 78, data: 215, iot: 42, latency: 23, successRate: 99.2 },
    { label: "Tue", voice: 80, data: 224, iot: 44, latency: 22, successRate: 99.4 },
    { label: "Wed", voice: 76, data: 210, iot: 41, latency: 24, successRate: 99.1 },
    { label: "Thu", voice: 82, data: 236, iot: 46, latency: 21, successRate: 99.5 },
    { label: "Fri", voice: 88, data: 248, iot: 48, latency: 20, successRate: 99.6 },
    { label: "Sat", voice: 74, data: 198, iot: 39, latency: 25, successRate: 98.9 },
    { label: "Sun", voice: 72, data: 186, iot: 37, latency: 26, successRate: 98.8 },
  ],
  "30D": [
    { label: "W1", voice: 525, data: 1420, iot: 282, latency: 24, successRate: 99.1 },
    { label: "W2", voice: 548, data: 1496, iot: 301, latency: 23, successRate: 99.3 },
    { label: "W3", voice: 567, data: 1540, iot: 312, latency: 22, successRate: 99.4 },
    { label: "W4", voice: 582, data: 1615, iot: 328, latency: 21, successRate: 99.6 },
  ],
  "90D": [
    { label: "Apr", voice: 2140, data: 5860, iot: 1128, latency: 25, successRate: 99.0 },
    { label: "May", voice: 2280, data: 6245, iot: 1210, latency: 23, successRate: 99.3 },
    { label: "Jun", voice: 2418, data: 6680, iot: 1294, latency: 21, successRate: 99.6 },
  ],
}

const healthByPeriod: Record<
  Period,
  { uptime: number; coverage: number; incidents: number; mttr: string; arpu: string; subscriberGrowth: string }
> = {
  "7D": { uptime: 99.94, coverage: 91.3, incidents: 3, mttr: "22m", arpu: "$31.42", subscriberGrowth: "+0.7%" },
  "30D": { uptime: 99.91, coverage: 90.6, incidents: 12, mttr: "27m", arpu: "$30.86", subscriberGrowth: "+2.1%" },
  "90D": { uptime: 99.87, coverage: 89.9, incidents: 34, mttr: "31m", arpu: "$29.74", subscriberGrowth: "+5.8%" },
}

const corridorUtilization = [
  { route: "North Fiber Ring", used: 82, capacityGbps: 400, jitterMs: 3.1 },
  { route: "East Metro Backhaul", used: 68, capacityGbps: 320, jitterMs: 2.4 },
  { route: "South Rural Cluster", used: 57, capacityGbps: 190, jitterMs: 4.2 },
  { route: "West Enterprise Edge", used: 76, capacityGbps: 280, jitterMs: 2.8 },
]

const SERIES_COLORS: Record<SeriesKey, string> = {
  voice: "oklch(0.627 0.265 303.9)",
  data: "oklch(0.696 0.17 162.48)",
  iot: "oklch(0.645 0.246 16.439)",
}

function meter(value: number) {
  return [
    { name: "value", value },
    { name: "rest", value: Math.max(0, 100 - value) },
  ]
}

function MetricCard({
  label,
  amount,
  change,
  subtext,
}: {
  label: string
  amount: string
  change: string
  subtext: string
}) {
  const isPositive = change.startsWith("+")

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{amount}</div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>{change}</span>
        <span className="text-muted-foreground">{subtext}</span>
      </div>
    </div>
  )
}

export function DashboardContent() {
  const [period, setPeriod] = useState<Period>("30D")
  const [chartMode, setChartMode] = useState<ChartMode>("throughput")
  const [activeSeries, setActiveSeries] = useState<Record<SeriesKey, boolean>>({
    voice: true,
    data: true,
    iot: true,
  })

  const selectedSeries = useMemo(
    () => (Object.keys(activeSeries) as SeriesKey[]).filter((key) => activeSeries[key]),
    [activeSeries],
  )
  const chartData = throughputByPeriod[period]
  const health = healthByPeriod[period]

  const totalTraffic = useMemo(
    () =>
      chartData.reduce((sum, point) => {
        const voice = activeSeries.voice ? point.voice : 0
        const data = activeSeries.data ? point.data : 0
        const iot = activeSeries.iot ? point.iot : 0
        return sum + voice + data + iot
      }, 0),
    [activeSeries, chartData],
  )
  const averageLatency = useMemo(
    () => chartData.reduce((sum, point) => sum + point.latency, 0) / chartData.length,
    [chartData],
  )
  const averageSuccessRate = useMemo(
    () => chartData.reduce((sum, point) => sum + point.successRate, 0) / chartData.length,
    [chartData],
  )

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (Object.values(next).every((value) => !value)) {
        return prev
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Telecom Operations Overview</h2>
          <p className="text-sm text-muted-foreground">Live-looking network performance snapshot for portfolio demo.</p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          {periodOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                period === option ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Throughput (TB)" amount={totalTraffic.toLocaleString()} change="+4.6%" subtext={`${period} trend`} />
        <MetricCard label="Network Uptime" amount={`${health.uptime.toFixed(2)}%`} change="+0.08%" subtext="vs previous period" />
        <MetricCard label="ARPU" amount={health.arpu} change="+1.3%" subtext="month-over-month" />
        <MetricCard label="Subscriber Growth" amount={health.subscriberGrowth} change="+0.4%" subtext={`Incidents: ${health.incidents}`} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="space-y-2">
              <div className="text-center font-medium">5G Coverage</div>
              <div className="h-32 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={meter(health.coverage)} innerRadius={50} outerRadius={65} startAngle={90} endAngle={-270} dataKey="value" paddingAngle={2}>
                      <Cell fill="oklch(0.645 0.246 16.439)" />
                      <Cell fill="oklch(0.9 0 0)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-muted-foreground">{health.coverage.toFixed(1)}% of urban and suburban zones</div>
            </div>

            <div className="space-y-2">
              <div className="text-center font-medium">Service Reliability</div>
              <div className="h-32 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meter(Number(averageSuccessRate.toFixed(1)))}
                      innerRadius={50}
                      outerRadius={65}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      <Cell fill="oklch(0.627 0.265 303.9)" />
                      <Cell fill="oklch(0.9 0 0)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-muted-foreground">{averageSuccessRate.toFixed(2)}% successful packet delivery</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {corridorUtilization.map((corridor) => (
              <div key={corridor.route} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium">{corridor.route}</span>
                  <span className="text-muted-foreground">
                    {corridor.used}% used · {corridor.capacityGbps}Gbps · jitter {corridor.jitterMs}ms
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded bg-muted">
                  <div className="h-full rounded bg-[oklch(0.696_0.17_162.48)]" style={{ width: `${corridor.used}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-4 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-[oklch(0.6_0.118_184.704)] sm:text-base">Traffic Intelligence Chart</div>
            <div className="inline-flex rounded-md border border-border p-1 text-xs">
              <button
                type="button"
                onClick={() => setChartMode("throughput")}
                className={`rounded px-2.5 py-1 ${chartMode === "throughput" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
              >
                Throughput
              </button>
              <button
                type="button"
                onClick={() => setChartMode("quality")}
                className={`rounded px-2.5 py-1 ${chartMode === "quality" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
              >
                Quality
              </button>
            </div>
          </div>
          <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
            Switch view mode and data layers to inspect traffic mix, latency, and service quality over time.
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(activeSeries) as SeriesKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleSeries(key)}
                className={`rounded border px-2.5 py-1 text-xs font-medium transition ${
                  activeSeries[key] ? "border-transparent text-white" : "border-border text-muted-foreground"
                }`}
                style={activeSeries[key] ? { backgroundColor: SERIES_COLORS[key] } : undefined}
              >
                {key.toUpperCase()}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              Avg latency: {averageLatency.toFixed(1)}ms · MTTR: {health.mttr}
            </span>
          </div>

          <div className="h-48 sm:h-64">
            {chartMode === "throughput" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
                  <XAxis dataKey="label" stroke="oklch(0.556 0 0)" fontSize={12} />
                  <YAxis stroke="oklch(0.556 0 0)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "oklch(0.97 0 0)" }}
                    formatter={(value: number, key: string) => [`${value.toLocaleString()} TB`, key.toUpperCase()]}
                  />
                  <Legend />
                  {selectedSeries.includes("voice") && <Bar dataKey="voice" fill={SERIES_COLORS.voice} radius={[4, 4, 0, 0]} />}
                  {selectedSeries.includes("data") && <Bar dataKey="data" fill={SERIES_COLORS.data} radius={[4, 4, 0, 0]} />}
                  {selectedSeries.includes("iot") && <Bar dataKey="iot" fill={SERIES_COLORS.iot} radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
                  <XAxis dataKey="label" stroke="oklch(0.556 0 0)" fontSize={12} />
                  <YAxis yAxisId="left" stroke="oklch(0.556 0 0)" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" domain={[98, 100]} stroke="oklch(0.556 0 0)" fontSize={12} />
                  <Tooltip
                    formatter={(value: number, key: string) =>
                      key === "latency" ? [`${value.toFixed(1)} ms`, "Latency"] : [`${value.toFixed(2)}%`, "Success Rate"]
                    }
                  />
                  <Legend />
                  <Line type="monotone" dataKey="latency" yAxisId="left" stroke="oklch(0.645 0.246 16.439)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="successRate" yAxisId="right" stroke="oklch(0.696 0.17 162.48)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

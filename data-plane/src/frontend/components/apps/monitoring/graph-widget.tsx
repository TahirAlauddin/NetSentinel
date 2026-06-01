"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardWidget, GraphDataPoint } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

function formatAxisTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface GraphWidgetProps {
  widget: DashboardWidget;
  onDelete?: (id: number) => void;
}

export function GraphWidget({ widget, onDelete }: GraphWidgetProps) {
  const itemId = widget.zabbix_item_id;
  const periodHours = widget.time_period_hours;
  const paramsKey = `${itemId}-${periodHours}`;

  const [points, setPoints] = useState<GraphDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState("");
  const [lastParamsKey, setLastParamsKey] = useState(paramsKey);

  if (lastParamsKey !== paramsKey) {
    setLastParamsKey(paramsKey);
    setLoading(true);
    setError(null);
    setPoints([]);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const res = await api.getGraphData({
        item_id: itemId,
        hours: periodHours,
      });
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setPoints([]);
      } else if (res.data) {
        setPoints(res.data.points);
        setUnits(res.data.units);
        setError(null);
      }
      setLoading(false);
    }

    void fetchData();
    const interval = setInterval(() => void fetchData(), widget.refresh_interval * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [itemId, periodHours, widget.refresh_interval]);

  const chartData = points.map((p) => ({
    label: formatAxisTime(p.timestamp),
    value: p.value,
  }));

  const subtitle = [widget.zabbix_host_name, widget.zabbix_item_name || widget.zabbix_item_key]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="h-full flex flex-col">
      {widget.show_header && (
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{widget.name}</CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(widget.id)}
              aria-label="Remove widget"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
      )}
      <CardContent className={widget.show_header ? "pt-0 flex-1" : "pt-4 flex-1"}>
        {loading && points.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center text-sm text-destructive px-2 text-center">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            {widget.chart_type === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} unit={units ? ` ${units}` : undefined} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value}${units ? ` ${units}` : ""}`,
                    widget.zabbix_item_name || "Value",
                  ]}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} unit={units ? ` ${units}` : undefined} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value}${units ? ` ${units}` : ""}`,
                    widget.zabbix_item_name || "Value",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

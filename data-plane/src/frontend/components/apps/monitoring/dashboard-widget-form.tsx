"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DashboardChartType,
  MonitoringLookupHost,
  MonitoringLookupItem,
} from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

const REFRESH_OPTIONS = [
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "300", label: "5 minutes" },
  { value: "900", label: "15 minutes" },
] as const;

const PERIOD_OPTIONS = [
  { value: "1", label: "Last 1 hour" },
  { value: "6", label: "Last 6 hours" },
  { value: "24", label: "Last 24 hours" },
  { value: "168", label: "Last 7 days" },
] as const;

const widgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  chart_type: z.enum(["line", "bar"]),
  host_id: z.string().min(1, "Select a host"),
  item_id: z.string().min(1, "Select an item"),
  refresh_interval: z.string(),
  time_period_hours: z.string(),
  show_header: z.boolean(),
});

type WidgetFormValues = z.infer<typeof widgetSchema>;

export function DashboardWidgetForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hosts, setHosts] = useState<MonitoringLookupHost[]>([]);
  const [items, setItems] = useState<MonitoringLookupItem[]>([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      name: "",
      chart_type: "line",
      host_id: "",
      item_id: "",
      refresh_interval: "60",
      time_period_hours: "1",
      show_header: true,
    },
  });

  const hostId = watch("host_id");
  const chartType = watch("chart_type");

  useEffect(() => {
    (async () => {
      setHostsLoading(true);
      const res = await api.lookupHosts();
      if (res.data) setHosts(res.data);
      setHostsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!hostId) {
      setItems([]);
      setValue("item_id", "");
      return;
    }
    (async () => {
      setItemsLoading(true);
      setValue("item_id", "");
      const res = await api.lookupItems({ host_id: hostId });
      if (res.data) setItems(res.data);
      setItemsLoading(false);
    })();
  }, [hostId, setValue]);

  const onSubmit = async (values: WidgetFormValues) => {
    const host = hosts.find((h) => String(h.id) === values.host_id);
    const item = items.find((i) => String(i.id) === values.item_id);
    if (!host || !item) {
      toast.error("Invalid host or item selection.");
      return;
    }

    setLoading(true);
    const res = await api.createDashboardWidget({
      name: values.name,
      chart_type: values.chart_type as DashboardChartType,
      zabbix_host_id: String(host.id),
      zabbix_host_name: host.name,
      zabbix_item_id: String(item.id),
      zabbix_item_name: item.name,
      zabbix_item_key: item.key,
      refresh_interval: Number(values.refresh_interval),
      time_period_hours: Number(values.time_period_hours),
      show_header: values.show_header,
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Widget added to dashboard.");
      router.push("/monitoring/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Widget</CardTitle>
          <CardDescription>Name and display options for this graph.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" {...register("name")} placeholder="CPU utilization" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={chartType}
              onValueChange={(v) => setValue("chart_type", v as "line" | "bar")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Graph (line)</SelectItem>
                <SelectItem value="bar">Graph (bar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Refresh interval</Label>
            <Select
              defaultValue="60"
              onValueChange={(v) => setValue("refresh_interval", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Time period</Label>
            <Select
              defaultValue="1"
              onValueChange={(v) => setValue("time_period_hours", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              id="show_header"
              defaultChecked
              onCheckedChange={(v) => setValue("show_header", v)}
            />
            <Label htmlFor="show_header">Show header</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data source</CardTitle>
          <CardDescription>
            Pick a Zabbix host and a numeric item to plot.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Host</Label>
            <Select
              value={hostId || undefined}
              onValueChange={(v) => setValue("host_id", v)}
              disabled={hostsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={hostsLoading ? "Loading hosts…" : "Select host"}
                />
              </SelectTrigger>
              <SelectContent>
                {hosts.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)}>
                    {h.name}
                    {h.technical_name !== h.name ? ` (${h.technical_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.host_id && (
              <p className="text-xs text-destructive">{errors.host_id.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Item</Label>
            <Select
              value={watch("item_id") || undefined}
              onValueChange={(v) => setValue("item_id", v)}
              disabled={!hostId || itemsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !hostId
                      ? "Select a host first"
                      : itemsLoading
                        ? "Loading items…"
                        : "Select item"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({item.key})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.item_id && (
              <p className="text-xs text-destructive">{errors.item_id.message}</p>
            )}
            {hostId && !itemsLoading && items.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No graphable items on this host.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Adding…" : "Add widget"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

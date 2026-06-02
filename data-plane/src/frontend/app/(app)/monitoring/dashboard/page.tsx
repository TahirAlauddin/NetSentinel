"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { GraphWidget } from "@/components/apps/monitoring/graph-widget";
import type { DashboardWidget } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function MonitoringDashboardPage() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchWidgets = async () => {
      const res = await api.getDashboardWidgets();
      if (!isMounted) return;

      if (res.error) {
        toast.error(res.error);
        setWidgets([]);
      } else {
        setWidgets(Array.isArray(res.data) ? res.data : []);
      }
      setLoading(false);
    };

    void fetchWidgets();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id: number) => {
    const res = await api.deleteDashboardWidget(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Widget removed.");
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <MonitoringHeader
          currentPage="Dashboard"
          breadcrumbs={[
            { label: "Monitoring", href: "/monitoring" },
            { label: "Dashboard" },
          ]}
        />
        <Button asChild className="shrink-0">
          <Link href="/monitoring/dashboard/widgets/add">
            <Plus className="h-4 w-4 mr-2" />
            Add widget
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : widgets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            No widgets yet. Add a line or bar graph from your Zabbix hosts and items.
          </p>
          <Button asChild>
            <Link href="/monitoring/dashboard/widgets/add">
              <Plus className="h-4 w-4 mr-2" />
              Add your first widget
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {widgets.map((widget) => (
            <GraphWidget key={widget.id} widget={widget} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

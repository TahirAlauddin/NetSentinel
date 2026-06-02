"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { HostForm } from "@/components/apps/monitoring/host-form";
import type { Host } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function EditHostPage() {
  const { id } = useParams();
  const [host, setHost] = useState<Host | null>(null);

  useEffect(() => {
    api.getHost(Number(id)).then((res) => {
      if (res.data) setHost(res.data);
    });
  }, [id]);

  if (!host) {
    return (
      <div className="p-6 text-muted-foreground text-sm animate-pulse">Loading host…</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader
        currentPage={`Edit: ${host.visible_name || host.name}`}
        breadcrumbs={[
          { label: "Monitoring", href: "/monitoring" },
          { label: "Hosts", href: "/monitoring/hosts" },
          { label: host.visible_name || host.name, href: `/monitoring/hosts/${id}` },
          { label: "Edit" },
        ]}
      />
      <HostForm host={host} isEdit />
    </div>
  );
}

"use client";

import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { HostForm } from "@/components/apps/monitoring/host-form";

export default function AddHostPage() {
  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader
        currentPage="Add Host"
        breadcrumbs={[
          { label: "Monitoring", href: "/monitoring" },
          { label: "Hosts", href: "/monitoring/hosts" },
          { label: "Add Host" },
        ]}
      />
      <HostForm />
    </div>
  );
}

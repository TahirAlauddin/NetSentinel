"use client";

import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { DashboardWidgetForm } from "@/components/apps/monitoring/dashboard-widget-form";

export default function AddDashboardWidgetPage() {
  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader
        currentPage="Add widget"
        breadcrumbs={[
          { label: "Monitoring", href: "/monitoring" },
          { label: "Dashboard", href: "/monitoring/dashboard" },
          { label: "Add widget" },
        ]}
      />
      <DashboardWidgetForm />
    </div>
  );
}

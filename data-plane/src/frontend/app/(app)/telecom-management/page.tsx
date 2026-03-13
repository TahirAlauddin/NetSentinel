"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { TelecomOverview } from "@/components/apps/telecom/telecom-overview";
import { TelecomServicesOverview } from "@/components/apps/telecom/telecom-services-overview";

export default function TelecomExpenseManagementPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "All" },
            ]}
          />

          <TelecomOverview />
          <TelecomServicesOverview />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

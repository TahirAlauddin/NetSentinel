"use client";

import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { InactiveHostsDashboard } from "@/components/apps/ipam/inactive-hosts-dashboard";

export default function InactiveHostsPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Inactive Hosts" />
      <IpamNavTabs />
      <InactiveHostsDashboard />
    </div>
  );
}


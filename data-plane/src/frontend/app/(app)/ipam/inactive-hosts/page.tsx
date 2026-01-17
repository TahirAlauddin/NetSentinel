"use client";

import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { InactiveHostsDashboard } from "@/components/ipam/inactive-hosts-dashboard";

export default function InactiveHostsPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Inactive Hosts" />
      <IpamNavTabs />
      <InactiveHostsDashboard />
    </div>
  );
}


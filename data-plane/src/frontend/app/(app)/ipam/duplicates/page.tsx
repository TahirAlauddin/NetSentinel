"use client";

import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { DuplicatesDashboard } from "@/components/apps/ipam/duplicates-dashboard";

export default function DuplicatesPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Duplicates" />
      <IpamNavTabs />
      <DuplicatesDashboard />
    </div>
  );
}


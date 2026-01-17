"use client";

import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DuplicatesDashboard } from "@/components/ipam/duplicates-dashboard";

export default function DuplicatesPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Duplicates" />
      <IpamNavTabs />
      <DuplicatesDashboard />
    </div>
  );
}


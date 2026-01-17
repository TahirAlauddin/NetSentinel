"use client";

import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { SubnetThresholdDashboard } from "@/components/ipam/subnet-threshold-dashboard";
import { Card } from "@/components/ui/card";

export default function ThresholdsPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Threshold Monitoring" />
      <IpamNavTabs />
      <Card className="p-6">
        <SubnetThresholdDashboard />
      </Card>
    </div>
  );
}

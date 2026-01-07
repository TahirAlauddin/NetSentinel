"use client";

import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { Card } from "@/components/ui/card";

export default function NatPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="NAT" />
      <IpamNavTabs />
      <Card className="p-6">
        <p className="text-muted-foreground">NAT management functionality coming soon.</p>
      </Card>
    </div>
  );
}


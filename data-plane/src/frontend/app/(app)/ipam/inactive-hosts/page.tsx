"use client";

import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { Card } from "@/components/ui/card";

export default function InactiveHostsPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Inactive Hosts" />
      <IpamNavTabs />
      <Card className="p-6">
        <p className="text-muted-foreground">Inactive hosts functionality coming soon.</p>
      </Card>
    </div>
  );
}


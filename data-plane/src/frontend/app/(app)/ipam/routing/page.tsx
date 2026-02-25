"use client";

import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { Card } from "@/components/ui/card";

export default function RoutingPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Routing" />
      <IpamNavTabs />
      <Card className="p-6">
        <p className="text-muted-foreground">Routing management functionality coming soon.</p>
      </Card>
    </div>
  );
}


"use client";

import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { Card } from "@/components/ui/card";

export default function TemporarySharesPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Temporary Shares" />
      <IpamNavTabs />
      <Card className="p-6">
        <p className="text-muted-foreground">Temporary shares functionality coming soon.</p>
      </Card>
    </div>
  );
}


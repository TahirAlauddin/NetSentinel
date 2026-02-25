"use client";

import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { IPTagManager } from "@/components/apps/ipam/ip-tag-manager";
import { Card } from "@/components/ui/card";

export default function IPTagsPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="IP Tags" />
      <IpamNavTabs />
      <Card className="p-6">
        <IPTagManager />
      </Card>
    </div>
  );
}

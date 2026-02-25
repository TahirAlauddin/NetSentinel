"use client";

import { useState } from "react";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { IPAuditLogViewer } from "@/components/apps/ipam/ip-audit-log-viewer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuditLogsPage() {
  const [ipAddress, setIPAddress] = useState("");

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Audit Logs" />
      <IpamNavTabs />
      <Card className="p-6">
        <div className="space-y-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="ip-filter">Filter by IP Address (optional)</Label>
            <Input
              id="ip-filter"
              value={ipAddress}
              onChange={(e) => setIPAddress(e.target.value)}
              placeholder="192.168.1.1"
              className="max-w-md"
            />
          </div>
        </div>
        <IPAuditLogViewer ipAddress={ipAddress || undefined} />
      </Card>
    </div>
  );
}

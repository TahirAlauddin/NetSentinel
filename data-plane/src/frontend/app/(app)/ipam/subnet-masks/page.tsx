"use client";

import { useState, useMemo } from "react";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { SubnetMaskTable } from "@/components/apps/ipam/subnet-mask-table";
import {
  getAllSubnetMasks,
  getCommonSubnetMasks,
  SubnetMaskInfo,
} from "@/lib/ipam/subnet-mask-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function SubnetMasksPage() {
  const [ipVersion, setIpVersion] = useState<"ipv4" | "ipv6">("ipv4");
  const [showCommon, setShowCommon] = useState(false);

  // Calculate masks directly on the frontend (no API call needed)
  const masks = useMemo<SubnetMaskInfo[]>(() => {
    const isIpv6 = ipVersion === "ipv6";
    return showCommon
      ? getCommonSubnetMasks(isIpv6)
      : getAllSubnetMasks(isIpv6);
  }, [ipVersion, showCommon]);

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Subnet Masks" />
      <IpamNavTabs />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="ip-version">IP Version:</Label>
          <Select value={ipVersion} onValueChange={(value) => setIpVersion(value as "ipv4" | "ipv6")}>
            <SelectTrigger id="ip-version" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ipv4">IPv4</SelectItem>
              <SelectItem value="ipv6">IPv6</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="show-common">Show:</Label>
          <Select
            value={showCommon ? "common" : "all"}
            onValueChange={(value) => setShowCommon(value === "common")}
          >
            <SelectTrigger id="show-common" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Masks</SelectItem>
              <SelectItem value="common">Common Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SubnetMaskTable masks={masks} loading={false} />
    </div>
  );
}

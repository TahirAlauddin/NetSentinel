"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Subnet } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();
import { Edit2, ArrowLeft } from "lucide-react";

export default function SubnetViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [subnet, setSubnet] = useState<Subnet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubnet = async () => {
      try {
        const response = await ipamApi.getSubnet(id);
        if (response.error) {
          throw new Error(response.error);
        }
        setSubnet(response.data as Subnet);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subnet");
      } finally {
        setLoading(false);
      }
    };
    loadSubnet();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Subnet Details" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading subnet...</div>
        </div>
      </div>
    );
  }

  if (error || !subnet) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Subnet Details" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "Subnet not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <IpamHeader currentPage={`Subnet: ${subnet.network}`} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/ipam/subnets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => router.push(`/ipam/subnets/edit/${id}`)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      <IpamNavTabs />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Network</div>
              <div className="font-mono">{subnet.network}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div>{subnet.status_display}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Description</div>
              <div>{subnet.description || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">IPv6</div>
              <div>{subnet.is_ipv6 ? "Yes" : "No"}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Relationships</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Subnet Group</div>
              <div>{subnet.group_detail?.name || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div>{subnet.location_detail?.name || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">VLAN</div>
              <div>{subnet.vlan_detail?.name || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">VRF</div>
              <div>{subnet.vrf_detail?.name || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Master Subnet</div>
              <div className="font-mono">{subnet.master_subnet_detail?.network || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div>{subnet.customer_detail?.name || "-"}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Network Configuration</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Gateway IP</div>
              <div className="font-mono">{subnet.gateway_ip || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Nameservers</div>
              <div>{subnet.nameservers || "-"}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Child Subnets</div>
              <div>{subnet.child_subnets_count}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">IP Addresses</div>
              <div>{subnet.ip_addresses_count}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div>{new Date(subnet.created_at).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Updated</div>
              <div>{new Date(subnet.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


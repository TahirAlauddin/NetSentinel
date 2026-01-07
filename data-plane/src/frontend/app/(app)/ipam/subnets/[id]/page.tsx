"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { SubnetDetailsTabs } from "@/components/ipam/subnet-details-tabs";
import { Button } from "@/components/ui/button";
import { Subnet } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { Edit2, ArrowLeft, Star, MoreVertical } from "lucide-react";

const ipamApi = new IpamApiClient();

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
        <IpamHeader
          currentPage={`Subnet: ${subnet.network}`}
          breadcrumbs={[
            { label: "Subnets", href: "/ipam/subnets" },
            { label: subnet.network },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/ipam/subnets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/ipam/subnets/edit/${id}`)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <IpamNavTabs />

      <SubnetDetailsTabs subnet={subnet} />
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { SubnetGroupForm } from "@/components/apps/ipam/subnet-group-form";
import { SubnetGroup } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { SubnetGroupCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function EditSubnetGroupPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [group, setGroup] = useState<SubnetGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const response = await ipamApi.getSubnetGroup(id);
        if (response.error) {
          throw new Error(response.error);
        }
        setGroup(response.data as SubnetGroup);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subnet group");
      } finally {
        setLoading(false);
      }
    };
    loadGroup();
  }, [id]);

  const handleSubmit = async (data: SubnetGroupCreateUpdateDto) => {
    setSaving(true);
    try {
      const response = await ipamApi.updateSubnetGroup(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/subnet-groups");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Subnet Group" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading subnet group...</div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Subnet Group" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "Subnet group not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit Subnet Group" />
      <IpamNavTabs />
      <SubnetGroupForm
        group={group}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/subnet-groups")}
        loading={saving}
      />
    </div>
  );
}


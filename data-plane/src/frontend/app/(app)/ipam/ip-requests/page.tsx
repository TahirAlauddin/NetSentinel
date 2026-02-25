"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { IPRequestQueue } from "@/components/apps/ipam/ip-request-queue";
import { IPRequestForm } from "@/components/apps/ipam/ip-request-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { IPRequest } from "@/types/ipam";

const ipamApi = new IpamApiClient();

export default function IPRequestsPage() {
  const [requests, setRequests] = useState<IPRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await ipamApi.getIPRequests({ status: "pending" });
      if (response.error) {
        throw new Error(response.error);
      }
      setRequests(extractIpamArrayData(response.data));
    } catch (error) {
      console.error("Error loading IP requests:", error);
      toast.error("Failed to load IP requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (data: {
    subnet: number;
    requested_ip?: string | null;
    purpose: string;
    description?: string | null;
    reservation_expires_at?: string | null;
  }) => {
    try {
      const response = await ipamApi.createIPRequest(data);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("IP request created successfully");
      loadRequests();
      setRequestFormOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create IP request";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleApprove = async (id: number, notes?: string) => {
    try {
      const response = await ipamApi.approveIPRequest(id, notes ? { approval_notes: notes } : undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("IP request approved");
      loadRequests();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to approve request";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleReject = async (id: number, notes?: string) => {
    try {
      const response = await ipamApi.rejectIPRequest(id, notes ? { approval_notes: notes } : undefined);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("IP request rejected");
      loadRequests();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject request";
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader
        currentPage="IP Requests"
      />
      <IpamNavTabs />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">IP Address Requests</h2>
        <Button onClick={() => setRequestFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading IP requests...</div>
        </div>
      ) : (
        <IPRequestQueue
          requests={requests}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={loading}
        />
      )}

      <IPRequestForm
        subnetId={selectedSubnet || undefined}
        open={requestFormOpen}
        onOpenChange={(open) => {
          setRequestFormOpen(open);
          if (!open) setSelectedSubnet(null);
        }}
        onSubmit={handleCreateRequest}
      />
    </div>
  );
}

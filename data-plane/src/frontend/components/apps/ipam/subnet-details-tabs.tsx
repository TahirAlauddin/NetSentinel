"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Subnet } from "@/types/ipam";
import { SubnetUsageChart } from "./subnet-usage-chart";
import { SubnetUtilizationDashboard } from "./subnet-utilization-dashboard";
import { IPRequestForm } from "./ip-request-form";
import { IPRequestQueue } from "./ip-request-queue";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { IPRequest } from "@/types/ipam";

function SubnetUtilizationTab({ subnet }: { subnet: Subnet }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubnetUsageChart subnet={subnet} />
        <SubnetUtilizationDashboard subnetId={subnet.id} />
      </div>
    </div>
  );
}

const ipamApi = new IpamApiClient();

interface SubnetDetailsTabsProps {
  subnet: Subnet;
}

/**
 * Subnet Details Tabs Component
 * Displays subnet information in a tabbed interface
 */
export function SubnetDetailsTabs({ subnet }: SubnetDetailsTabsProps) {
  const [ipRequests, setIpRequests] = useState<IPRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestFormOpen, setRequestFormOpen] = useState(false);

  useEffect(() => {
    loadIPRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subnet.id]);

  const loadIPRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await ipamApi.getSubnetIPRequests(subnet.id);
      if (response.error) {
        console.error("Error loading IP requests:", response.error);
      } else {
        setIpRequests(extractIpamArrayData(response.data));
      }
    } catch (error) {
      console.error("Error loading IP requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCreateRequest = async (data: { subnet: number; requested_ip?: string | null; purpose: string; description?: string | null; reservation_expires_at?: string | null }) => {
    try {
      const response = await ipamApi.createSubnetIPRequest(subnet.id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("IP request created successfully");
      loadIPRequests();
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
      loadIPRequests();
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
      loadIPRequests();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject request";
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
        <TabsTrigger value="details">Subnet Details</TabsTrigger>
        <TabsTrigger value="usage">Usage</TabsTrigger>
        <TabsTrigger value="network">Network Config</TabsTrigger>
        <TabsTrigger value="relationships">Relationships</TabsTrigger>
        <TabsTrigger value="ip-requests">IP Requests</TabsTrigger>
        <TabsTrigger value="statistics" className="hidden lg:block">Statistics</TabsTrigger>
        <TabsTrigger value="features" className="hidden lg:block">Features</TabsTrigger>
        <TabsTrigger value="changelog" className="hidden lg:block">Changelog</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Subnet</div>
                  <div className="font-mono text-lg">{subnet.network}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                  <div className="text-lg">{subnet.status_display}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                  <div>{subnet.description || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">IPv6</div>
                  <div>{subnet.is_ipv6 ? "Yes" : "No"}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Subnet Usage</div>
                  <div className="text-lg">
                    Used: {subnet.ip_addresses_count || 0} | Free:{" "}
                    {Math.max(
                      0,
                      Math.pow(2, subnet.is_ipv6 ? 128 : 32 - parseInt(subnet.network.split("/")[1] || "24")) -
                        (subnet.ip_addresses_count || 0)
                    )}{" "}
                    | Total: {Math.pow(2, subnet.is_ipv6 ? 128 : 32 - parseInt(subnet.network.split("/")[1] || "24"))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">VLAN</div>
                  <div>{subnet.vlan_detail ? `${subnet.vlan_detail.name} (${subnet.vlan_detail.vlan_id})` : "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">VRF</div>
                  <div>{subnet.vrf_detail?.name || "None"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Customer</div>
                  <div>{subnet.customer_detail?.name || "-"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="usage" className="mt-6">
        <SubnetUtilizationTab subnet={subnet} />
      </TabsContent>

      <TabsContent value="network" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Gateway IP</div>
                <div className="font-mono">{subnet.gateway_ip || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Nameservers</div>
                <div>{subnet.nameservers || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="relationships" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Subnet Group</div>
                <div>{subnet.group_detail?.name || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
                <div>{subnet.location_detail?.name || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">VLAN</div>
                <div>{subnet.vlan_detail ? `${subnet.vlan_detail.name} (${subnet.vlan_detail.vlan_id})` : "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">VRF</div>
                <div>{subnet.vrf_detail?.name || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Master Subnet</div>
                <div className="font-mono">{subnet.master_subnet_detail?.network || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Customer</div>
                <div>{subnet.customer_detail?.name || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="statistics" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Child Subnets</div>
                <div className="text-2xl font-bold">{subnet.child_subnets_count}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">IP Addresses</div>
                <div className="text-2xl font-bold">{subnet.ip_addresses_count || 0}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Created</div>
                <div>{new Date(subnet.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Last Updated</div>
                <div>{new Date(subnet.updated_at).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ip-requests" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">IP Address Requests</h3>
                <Button onClick={() => setRequestFormOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  New Request
                </Button>
              </div>
              <IPRequestQueue
                requests={ipRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={loadingRequests}
              />
            </div>
          </CardContent>
        </Card>
        <IPRequestForm
          subnetId={subnet.id}
          subnetNetwork={subnet.network}
          open={requestFormOpen}
          onOpenChange={setRequestFormOpen}
          onSubmit={handleCreateRequest}
        />
      </TabsContent>

      <TabsContent value="features" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">IP Requests</span>
                <span className="text-sm text-green-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hosts Check</span>
                <span className="text-sm text-muted-foreground">Disabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Discover New Hosts</span>
                <span className="text-sm text-muted-foreground">Disabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resolve DNS Names</span>
                <span className="text-sm text-muted-foreground">Disabled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="changelog" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Created</div>
                <div>{new Date(subnet.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Last Edited</div>
                <div>{new Date(subnet.updated_at).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}


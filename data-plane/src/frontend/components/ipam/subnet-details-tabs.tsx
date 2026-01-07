"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Subnet } from "@/types/ipam";
import { SubnetUsageChart } from "./subnet-usage-chart";

interface SubnetDetailsTabsProps {
  subnet: Subnet;
}

/**
 * Subnet Details Tabs Component
 * Displays subnet information in a tabbed interface
 */
export function SubnetDetailsTabs({ subnet }: SubnetDetailsTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
        <TabsTrigger value="details">Subnet Details</TabsTrigger>
        <TabsTrigger value="usage">Usage</TabsTrigger>
        <TabsTrigger value="network">Network Config</TabsTrigger>
        <TabsTrigger value="relationships">Relationships</TabsTrigger>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubnetUsageChart subnet={subnet} />
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total IP Addresses</div>
                <div className="text-2xl font-bold">
                  {Math.pow(2, subnet.is_ipv6 ? 128 : 32 - parseInt(subnet.network.split("/")[1] || "24")).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Used IP Addresses</div>
                <div className="text-2xl font-bold text-[oklch(0.40_0.15_249)]">
                  {(subnet.ip_addresses_count || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Free IP Addresses</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(
                    0,
                    Math.pow(2, subnet.is_ipv6 ? 128 : 32 - parseInt(subnet.network.split("/")[1] || "24")) -
                      (subnet.ip_addresses_count || 0)
                  ).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Usage Percentage</div>
                <div className="text-2xl font-bold">
                  {(
                    ((subnet.ip_addresses_count || 0) /
                      Math.pow(2, subnet.is_ipv6 ? 128 : 32 - parseInt(subnet.network.split("/")[1] || "24"))) *
                    100
                  ).toFixed(2)}
                  %
                </div>
              </div>
            </div>
          </Card>
        </div>
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

      <TabsContent value="features" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">IP Requests</span>
                <span className="text-sm text-muted-foreground">Disabled</span>
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


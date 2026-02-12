"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ExternalLink,
  Network,
  FolderTree,
  Users,
  Layers,
  Router,
  Server,
  FileCheck,
  Phone,
} from "lucide-react";
import { Subnet } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

/**
 * IPAM Dashboard Page
 * This page displays the IPAM dashboard with statistics, favorite subnets, and recent logs.
 */
export default function IpamDashboardPage() {
  const router = useRouter();
  const [allSubnets, setAllSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter to only show favorite subnets
  const favoriteSubnets = useMemo(() => {
    return allSubnets.filter((subnet) => subnet.is_favorite === true).slice(0, 10); // Show top 10
  }, [allSubnets]);

  useEffect(() => {
    const loadSubnets = async () => {
      try {
        setLoading(true);
        const response = await ipamApi.getSubnets();
        
        if (response.data && !response.error) {
          setAllSubnets(extractIpamArrayData(response.data));
        }
      } catch (err) {
        console.error("Error loading subnets:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSubnets();
  }, []);

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="IPAM Dashboard" />
      <IpamNavTabs />

      {/* Quick links to main sections */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/subnets" className="gap-2">
            <Network className="w-4 h-4" />
            Subnets
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/subnet-groups" className="gap-2">
            <FolderTree className="w-4 h-4" />
            Subnet Groups
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/customers" className="gap-2">
            <Users className="w-4 h-4" />
            Customers
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/vlans" className="gap-2">
            <Layers className="w-4 h-4" />
            VLAN
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/vrfs" className="gap-2">
            <Router className="w-4 h-4" />
            VRF
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/devices" className="gap-2">
            <Server className="w-4 h-4" />
            Devices
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/ip-requests" className="gap-2">
            <FileCheck className="w-4 h-4" />
            IP Requests
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ipam/phone-numbers" className="gap-2">
            <Phone className="w-4 h-4" />
            Phone Numbers
          </Link>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Favorite Subnets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Favourite Subnets
                </CardTitle>
                {favoriteSubnets.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/ipam/favourite-subnets")}
                  >
                    View All
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading favorite subnets...
                </div>
              ) : favoriteSubnets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No favourite subnets yet</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/ipam/subnets")}
                  >
                    Browse Subnets
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Network</th>
                        <th className="text-left py-2 px-4">Description</th>
                        <th className="text-left py-2 px-4">Group</th>
                        <th className="text-left py-2 px-4">VLAN</th>
                        <th className="text-left py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {favoriteSubnets.map((subnet) => (
                        <tr
                          key={subnet.id}
                          className="border-b hover:bg-accent/50 cursor-pointer"
                          onClick={() => router.push(`/ipam/subnets/${subnet.id}`)}
                        >
                          <td className="py-2 px-4 font-mono">{subnet.network}</td>
                          <td className="py-2 px-4">
                            {subnet.description || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {subnet.group_detail?.name || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {subnet.vlan_detail?.name || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            <Badge variant="outline" className="capitalize">
                              {subnet.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Recent Change Log Entries */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Most Recent Change Log Entries</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">User</th>
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-left py-2 px-4">Object</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Most Recent Informational Logs */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Most Recent Informational Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Severity</th>
                    <th className="text-left py-2 px-4">Command</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Username</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Sections</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Subnets</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of VLANs</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of VRFs</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of IPv4 addresses</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of IPv6 addresses</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Devices</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Locations</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Racks</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of users</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </Card>

          {/* Most Recent Warning / Error Logs */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Most Recent Warning / Error Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Severity</th>
                    <th className="text-left py-2 px-4">Command</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Username</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


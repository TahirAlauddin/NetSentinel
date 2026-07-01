"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
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
} from "lucide-react";
import { Subnet } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData, extractIpamCount } from "@/lib/ipam-utils";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { UserApiClient } from "@/lib/api-client/user";

const ipamApi = new IpamApiClient();
const infrastructureApi = new InfrastructureApiClient();
const userApi = new UserApiClient();

interface DashboardStats {
  sections: number;
  subnets: number;
  vlans: number;
  vrfs: number;
  ipv4Addresses: number;
  ipv6Addresses: number;
  devices: number;
  locations: number;
  racks: number;
  users: number;
}

/**
 * IPAM Dashboard Page
 * This page displays the IPAM dashboard with statistics, favorite subnets, and recent logs.
 */
export default function IpamDashboardPage() {
  const router = useRouter();
  const [allSubnets, setAllSubnets] = useState<Subnet[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    sections: 0,
    subnets: 0,
    vlans: 0,
    vrfs: 0,
    ipv4Addresses: 0,
    ipv6Addresses: 0,
    devices: 0,
    locations: 0,
    racks: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter to only show favorite subnets
  const favoriteSubnets = useMemo(() => {
    return allSubnets.filter((subnet) => subnet.is_favorite === true).slice(0, 10); // Show top 10
  }, [allSubnets]);

  const subnetStatusSummary = useMemo(() => {
    return allSubnets.reduce(
      (acc, subnet) => {
        if (subnet.status === "active") acc.active += 1;
        else if (subnet.status === "planned") acc.planned += 1;
        else if (subnet.status === "deprecated") acc.deprecated += 1;
        return acc;
      },
      { active: 0, planned: 0, deprecated: 0 }
    );
  }, [allSubnets]);

  const newestSubnets = useMemo(() => {
    return [...allSubnets]
      .sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return bTime - aTime;
      })
      .slice(0, 8);
  }, [allSubnets]);

  const locationDistribution = useMemo(() => {
    const counts = new Map<string, number>();

    allSubnets.forEach((subnet) => {
      const locationName = subnet.location_detail?.name || `Location ${subnet.location}`;
      counts.set(locationName, (counts.get(locationName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allSubnets]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [
          subnetResponse,
          subnetGroupResponse,
          vlanResponse,
          vrfResponse,
          ipAddressResponse,
          deviceResponse,
          locationResponse,
          rackResponse,
          usersResponse,
        ] = await Promise.all([
          ipamApi.getSubnets(),
          ipamApi.getSubnetGroups({ page: 1, page_size: 1 }),
          ipamApi.getVlans({ page: 1, page_size: 1 }),
          ipamApi.getVrfs({ page: 1, page_size: 1 }),
          ipamApi.getIPAddresses(),
          ipamApi.getDevices({ page: 1, page_size: 1 }),
          infrastructureApi.getLocations({ page: 1, page_size: 1 }),
          ipamApi.getRacks({ page: 1, page_size: 1 }),
          userApi.getUsers({ page: 1, page_size: 1 }),
        ]);

        const subnets = subnetResponse.error ? [] : extractIpamArrayData<Subnet>(subnetResponse.data);
        const totalSubnets = subnetResponse.error ? 0 : extractIpamCount(subnetResponse.data);
        const ipAddresses = ipAddressResponse.error
          ? []
          : extractIpamArrayData<{ address?: string | null }>(ipAddressResponse.data);

        const ipv4Addresses = ipAddresses.filter((ip) => ip.address && !ip.address.includes(":")).length;
        const ipv6Addresses = ipAddresses.filter((ip) => ip.address && ip.address.includes(":")).length;

        setAllSubnets(subnets);
        setStats({
          sections: subnetGroupResponse.error ? 0 : extractIpamCount(subnetGroupResponse.data),
          subnets: totalSubnets,
          vlans: vlanResponse.error ? 0 : extractIpamCount(vlanResponse.data),
          vrfs: vrfResponse.error ? 0 : extractIpamCount(vrfResponse.data),
          ipv4Addresses,
          ipv6Addresses,
          devices: deviceResponse.error ? 0 : extractIpamCount(deviceResponse.data),
          locations: locationResponse.error ? 0 : extractIpamCount(locationResponse.data),
          racks: rackResponse.error ? 0 : extractIpamCount(rackResponse.data),
          users: usersResponse.error ? 0 : extractIpamCount(usersResponse.data),
        });
      } catch (err) {
        console.error("Error loading IPAM dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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

          {/* Subnet Status Overview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Subnet Status Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-semibold">{subnetStatusSummary.active}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Planned</p>
                <p className="text-xl font-semibold">{subnetStatusSummary.planned}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Deprecated</p>
                <p className="text-xl font-semibold">{subnetStatusSummary.deprecated}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Favourites</p>
                <p className="text-xl font-semibold">{favoriteSubnets.length}</p>
              </div>
            </div>
          </Card>

          {/* Recent Subnets + Location Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Subnets</h2>
            {newestSubnets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subnet data available.</p>
            ) : (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Network</th>
                      <th className="text-left py-2 px-4">Location</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newestSubnets.map((subnet) => (
                      <tr
                        key={subnet.id}
                        className="border-b hover:bg-accent/50 cursor-pointer"
                        onClick={() => router.push(`/ipam/subnets/${subnet.id}`)}
                      >
                        <td className="py-2 px-4 font-mono">{subnet.network}</td>
                        <td className="py-2 px-4">{subnet.location_detail?.name || "-"}</td>
                        <td className="py-2 px-4 capitalize">{subnet.status}</td>
                        <td className="py-2 px-4">
                          {new Date(subnet.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="text-base font-semibold mb-3">Top Locations by Subnets</h3>
            {locationDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No location distribution available.</p>
            ) : (
              <div className="space-y-2">
                {locationDistribution.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ipam/subnets")}
              >
                View All Subnets
              </Button>
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
                <span className="font-medium">{stats.sections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Subnets</span>
                <span className="font-medium">{stats.subnets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of VLANs</span>
                <span className="font-medium">{stats.vlans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of VRFs</span>
                <span className="font-medium">{stats.vrfs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of IPv4 addresses</span>
                <span className="font-medium">{stats.ipv4Addresses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of IPv6 addresses</span>
                <span className="font-medium">{stats.ipv6Addresses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Devices</span>
                <span className="font-medium">{stats.devices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Locations</span>
                <span className="font-medium">{stats.locations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Racks</span>
                <span className="font-medium">{stats.racks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of users</span>
                <span className="font-medium">{stats.users}</span>
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


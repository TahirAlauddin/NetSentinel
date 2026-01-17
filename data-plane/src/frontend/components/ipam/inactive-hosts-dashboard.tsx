"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Trash2, AlertTriangle, Calendar } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import type { IPAddress } from "@/types/ipam";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ipamApi = new IpamApiClient();

interface InactiveHostsSummary {
  total_inactive: number;
  by_status: Record<string, number>;
  by_subnet: Record<string, number>;
  oldest_inactive: {
    address: string;
    last_updated: string | null;
    days_inactive: number;
  } | null;
  threshold_days: number;
}

export function InactiveHostsDashboard() {
  const [inactiveHosts, setInactiveHosts] = useState<IPAddress[]>([]);
  const [summary, setSummary] = useState<InactiveHostsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [thresholdDays, setThresholdDays] = useState(90);
  const [selectedIPs, setSelectedIPs] = useState<Set<number>>(new Set());
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showDeprecateDialog, setShowDeprecateDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hostsResponse, summaryResponse] = await Promise.all([
        ipamApi.getInactiveHosts({ threshold_days: thresholdDays }),
        ipamApi.getInactiveHostsSummary(thresholdDays),
      ]);

      if (hostsResponse.data) {
        setInactiveHosts(hostsResponse.data);
      }
      if (summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch (error) {
      toast.error("Failed to load inactive hosts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdDays]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIPs(new Set(inactiveHosts.map((ip) => ip.id)));
    } else {
      setSelectedIPs(new Set());
    }
  };

  const handleSelectIP = (ipId: number, checked: boolean) => {
    const newSelected = new Set(selectedIPs);
    if (checked) {
      newSelected.add(ipId);
    } else {
      newSelected.delete(ipId);
    }
    setSelectedIPs(newSelected);
  };

  const handleBulkRelease = async () => {
    if (selectedIPs.size === 0) {
      toast.error("Please select at least one IP address");
      return;
    }

    setActionLoading(true);
    try {
      const response = await ipamApi.bulkReleaseInactiveHosts(
        Array.from(selectedIPs),
        "Inactive host cleanup"
      );

      if (response.data) {
        toast.success(
          `Released ${response.data.released} IP address(es)`
        );
        setSelectedIPs(new Set());
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to release IP addresses");
      console.error(error);
    } finally {
      setActionLoading(false);
      setShowReleaseDialog(false);
    }
  };

  const handleBulkDeprecate = async () => {
    if (selectedIPs.size === 0) {
      toast.error("Please select at least one IP address");
      return;
    }

    setActionLoading(true);
    try {
      const response = await ipamApi.bulkDeprecateInactiveHosts(
        Array.from(selectedIPs),
        "Inactive host"
      );

      if (response.data) {
        toast.success(
          `Deprecated ${response.data.deprecated} IP address(es)`
        );
        setSelectedIPs(new Set());
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to deprecate IP addresses");
      console.error(error);
    } finally {
      setActionLoading(false);
      setShowDeprecateDialog(false);
    }
  };

  const getDaysInactive = (updatedAt: string | null, createdAt: string) => {
    const date = updatedAt ? new Date(updatedAt) : new Date(createdAt);
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500";
      case "reserved":
        return "bg-yellow-500";
      case "dhcp":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inactive</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_inactive || 0}</div>
            <p className="text-xs text-muted-foreground">
              Threshold: {thresholdDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {summary?.by_status &&
                Object.entries(summary.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{status}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest Inactive</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summary?.oldest_inactive ? (
              <div>
                <div className="text-lg font-semibold">
                  {summary.oldest_inactive.address}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.oldest_inactive.days_inactive} days ago
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReleaseDialog(true)}
                disabled={selectedIPs.size === 0 || actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Release ({selectedIPs.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeprecateDialog(true)}
                disabled={selectedIPs.size === 0 || actionLoading}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Deprecate ({selectedIPs.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Configure inactivity threshold</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="threshold">Threshold (days)</Label>
              <Input
                id="threshold"
                type="number"
                value={thresholdDays}
                onChange={(e) => setThresholdDays(parseInt(e.target.value) || 90)}
                min={1}
                max={365}
              />
            </div>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inactive Hosts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inactive Hosts</CardTitle>
          <CardDescription>
            IP addresses that haven&apos;t been updated in {thresholdDays} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inactiveHosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inactive hosts found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIPs.size === inactiveHosts.length && inactiveHosts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Subnet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Days Inactive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveHosts.map((ip) => {
                    const daysInactive = getDaysInactive(ip.updated_at || null, ip.created_at);
                    return (
                      <TableRow key={ip.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIPs.has(ip.id)}
                            onCheckedChange={(checked) =>
                              handleSelectIP(ip.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono">{ip.address}</TableCell>
                        <TableCell>
                          {ip.subnet_detail?.network || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ip.status)}>
                            {ip.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ip.assigned_to_asset_detail?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {ip.updated_at
                            ? formatDistanceToNow(new Date(ip.updated_at), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{daysInactive}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Release Dialog */}
      <AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Inactive IP Addresses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to release {selectedIPs.size} inactive IP address(es)?
              This will mark them as available and remove their assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRelease} disabled={actionLoading}>
              {actionLoading ? "Releasing..." : "Release"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deprecate Dialog */}
      <AlertDialog open={showDeprecateDialog} onOpenChange={setShowDeprecateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deprecate Inactive IP Addresses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {selectedIPs.size} inactive IP address(es) as
              deprecated? This will mark them as deprecated but keep their assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeprecate} disabled={actionLoading}>
              {actionLoading ? "Deprecating..." : "Deprecate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

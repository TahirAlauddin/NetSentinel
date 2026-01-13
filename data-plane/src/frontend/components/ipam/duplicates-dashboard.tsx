"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { toast } from "sonner";

const ipamApi = new IpamApiClient();

interface DuplicateIP {
  address: string;
  count: number;
  instances: Array<{
    id: number;
    subnet_id: number | null;
    subnet_network: string | null;
    status: string;
    assigned_to_asset_id: number | null;
    assigned_to_asset_name: string | null;
    description: string | null;
    created_at: string;
    updated_at: string | null;
  }>;
  conflicts: Array<{
    ip_id: number;
    subnet_id: number;
    subnet_network: string;
    status: string;
  }>;
}

interface DuplicateSubnet {
  subnet_id: number;
  subnet_network: string;
  description: string | null;
  overlaps: Array<{
    type: string;
    subnet_id: number;
    subnet_network: string;
    description: string | null;
  }>;
}

interface DuplicatesSummary {
  duplicate_ips_count: number;
  duplicate_subnets_count: number;
  total_duplicate_ips: number;
  duplicate_ips: DuplicateIP[];
  duplicate_subnets: DuplicateSubnet[];
}

export function DuplicatesDashboard() {
  const [duplicateIPs, setDuplicateIPs] = useState<DuplicateIP[]>([]);
  const [duplicateSubnets, setDuplicateSubnets] = useState<DuplicateSubnet[]>([]);
  const [summary, setSummary] = useState<DuplicatesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateIP | null>(null);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolving, setResolving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ipsResponse, subnetsResponse, summaryResponse] = await Promise.all([
        ipamApi.getDuplicateIPs(),
        ipamApi.getDuplicateSubnets(),
        ipamApi.getDuplicatesSummary(),
      ]);

      if (ipsResponse.data) {
        setDuplicateIPs(ipsResponse.data);
      }
      if (subnetsResponse.data) {
        setDuplicateSubnets(subnetsResponse.data);
      }
      if (summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch (error) {
      toast.error("Failed to load duplicates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGetSuggestion = async (duplicate: DuplicateIP) => {
    try {
      const response = await ipamApi.getDuplicateResolutionSuggestion(duplicate.address);
      if (response.data) {
        setSuggestion(response.data);
        setSelectedDuplicate(duplicate);
        setShowResolveDialog(true);
      }
    } catch (error) {
      toast.error("Failed to get resolution suggestion");
      console.error(error);
    }
  };

  const handleResolve = async () => {
    if (!suggestion || !selectedDuplicate) return;

    setResolving(true);
    try {
      const response = await ipamApi.resolveDuplicate(
        suggestion.address,
        suggestion.ip_to_keep || 0,
        suggestion.ips_to_remove || []
      );

      if (response.data) {
        toast.success(
          `Resolved ${response.data.resolved} duplicate(s)`
        );
        setShowResolveDialog(false);
        setSelectedDuplicate(null);
        setSuggestion(null);
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to resolve duplicates");
      console.error(error);
    } finally {
      setResolving(false);
    }
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicate IPs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.duplicate_ips_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.total_duplicate_ips || 0} total instances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicate Subnets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.duplicate_subnets_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Overlapping or exact duplicates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={loadData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Duplicates Tabs */}
      <Tabs defaultValue="ips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ips">
            Duplicate IPs ({duplicateIPs.length})
          </TabsTrigger>
          <TabsTrigger value="subnets">
            Duplicate Subnets ({duplicateSubnets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate IP Addresses</CardTitle>
              <CardDescription>
                IP addresses that appear multiple times across subnets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : duplicateIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No duplicate IP addresses found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicateIPs.map((dup) => (
                    <Card key={dup.address}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="font-mono">{dup.address}</CardTitle>
                            <CardDescription>
                              Found {dup.count} time(s) across different subnets
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleGetSuggestion(dup)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Subnet</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dup.instances.map((instance) => (
                                <TableRow key={instance.id}>
                                  <TableCell className="font-mono">
                                    #{instance.id}
                                  </TableCell>
                                  <TableCell>
                                    {instance.subnet_network || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(instance.status)}>
                                      {instance.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {instance.assigned_to_asset_name || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(instance.created_at).toLocaleDateString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {dup.conflicts.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              Conflicts detected: Same IP in {dup.conflicts.length} different
                              subnet(s)
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subnets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate/Overlapping Subnets</CardTitle>
              <CardDescription>
                Subnets that overlap or are exact duplicates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : duplicateSubnets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No duplicate or overlapping subnets found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicateSubnets.map((subnet) => (
                    <Card key={subnet.subnet_id}>
                      <CardHeader>
                        <CardTitle className="font-mono">{subnet.subnet_network}</CardTitle>
                        <CardDescription>
                          {subnet.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Overlaps with:</p>
                          <div className="space-y-2">
                            {subnet.overlaps.map((overlap, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 bg-muted rounded-md"
                              >
                                <Badge variant={overlap.type === "exact_duplicate" ? "destructive" : "warning"}>
                                  {overlap.type === "exact_duplicate" ? "Exact Duplicate" : "Overlap"}
                                </Badge>
                                <span className="font-mono">{overlap.subnet_network}</span>
                                {overlap.description && (
                                  <span className="text-sm text-muted-foreground">
                                    - {overlap.description}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Duplicate IP Address</AlertDialogTitle>
            <AlertDialogDescription>
              Review the suggested resolution for {suggestion?.address}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {suggestion && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Recommended Action:</p>
                <p className="text-sm">{suggestion.reason}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Keep IP #{suggestion.ip_to_keep}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">
                    Remove {suggestion.ips_to_remove.length} duplicate(s)
                  </span>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} disabled={resolving}>
              {resolving ? "Resolving..." : "Resolve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

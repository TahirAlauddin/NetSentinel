"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Play, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { Subnet, NetworkScan } from "@/types/ipam";

const ipamApi = new IpamApiClient();


export default function ScannedNetworksPage() {
  const router = useRouter();
  const [scans, setScans] = useState<NetworkScan[]>([]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedSubnet, setSelectedSubnet] = useState<string>("");
  const [scanType, setScanType] = useState<string>("ping");
  const [timeout, setTimeout] = useState<number>(3);

  useEffect(() => {
    loadScans();
    loadSubnets();
  }, []);

  const loadScans = async () => {
    setLoading(true);
    try {
      const response = await ipamApi.getNetworkScans();
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setScans(extractIpamArrayData<NetworkScan>(response.data));
      }
    } catch (error) {
      console.error("Error loading scans:", error);
      toast.error("Failed to load network scans");
    } finally {
      setLoading(false);
    }
  };

  const loadSubnets = async () => {
    try {
      const response = await ipamApi.getSubnets();
      if (response.data) {
        setSubnets(extractIpamArrayData(response.data));
      }
    } catch (error) {
      console.error("Error loading subnets:", error);
    }
  };

  const handleStartScan = async () => {
    if (!selectedSubnet) {
      toast.error("Please select a subnet to scan");
      return;
    }

    setScanning(true);
    try {
      const response = await ipamApi.createNetworkScan({
        subnet: parseInt(selectedSubnet),
        scan_type: scanType,
        timeout: timeout,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Network scan started");
      await loadScans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start scan");
    } finally {
      setScanning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      running: "secondary",
      failed: "destructive",
      pending: "outline",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Scanned Networks" />
      <IpamNavTabs />

      {/* Start New Scan */}
      <Card>
        <CardHeader>
          <CardTitle>Start Network Scan</CardTitle>
          <CardDescription>
            Discover active hosts in a subnet by performing a network scan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subnet">Subnet</Label>
              <Select value={selectedSubnet} onValueChange={setSelectedSubnet}>
                <SelectTrigger id="subnet">
                  <SelectValue placeholder="Select subnet" />
                </SelectTrigger>
                <SelectContent>
                  {subnets.map((subnet) => (
                    <SelectItem key={subnet.id} value={subnet.id.toString()}>
                      {subnet.network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scan-type">Scan Type</Label>
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger id="scan-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ping">Ping/ICMP</SelectItem>
                  <SelectItem value="arp">ARP</SelectItem>
                  <SelectItem value="tcp">TCP Port Scan</SelectItem>
                  <SelectItem value="full">Full Scan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value) || 3)}
                min={1}
                max={30}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleStartScan}
                disabled={scanning || !selectedSubnet}
                className="w-full"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>Previous network scans and their results</CardDescription>
            </div>
            <Button variant="outline" onClick={loadScans} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading scans...
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No network scans yet</p>
              <p className="text-sm mt-2">Start a scan to discover active hosts</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subnet</TableHead>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hosts Found</TableHead>
                    <TableHead>New Hosts</TableHead>
                    <TableHead>Missing Hosts</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-mono">
                        {scan.subnet_detail?.network || `Subnet #${scan.subnet}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{scan.scan_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(scan.status)}</TableCell>
                      <TableCell>{scan.hosts_found}</TableCell>
                      <TableCell>
                        {scan.hosts_new > 0 ? (
                          <Badge variant="secondary">{scan.hosts_new}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {scan.hosts_missing > 0 ? (
                          <Badge variant="destructive">{scan.hosts_missing}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {scan.started_at
                          ? new Date(scan.started_at).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/ipam/scanned-networks/${scan.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

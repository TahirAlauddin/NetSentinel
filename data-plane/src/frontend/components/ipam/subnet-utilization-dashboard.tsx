"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, TrendingUp, Activity } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import type { SubnetUtilization, UtilizationSummary } from "@/types/ipam";
import { toast } from "sonner";

const ipamApi = new IpamApiClient();

interface SubnetUtilizationDashboardProps {
  subnetId: number;
}

export function SubnetUtilizationDashboard({ subnetId }: SubnetUtilizationDashboardProps) {
  const [utilization, setUtilization] = useState<SubnetUtilization | null>(null);
  const [summary, setSummary] = useState<UtilizationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [growthRate, setGrowthRate] = useState(0.05);
  const [projectionMonths, setProjectionMonths] = useState(12);

  useEffect(() => {
    loadUtilization();
    loadSummary();
  }, [subnetId]);

  const loadUtilization = async () => {
    try {
      const response = await ipamApi.getSubnetUtilization(subnetId);
      if (response.error) {
        throw new Error(response.error);
      }
      setUtilization(response.data as SubnetUtilization);
    } catch (error) {
      console.error("Error loading utilization:", error);
      toast.error("Failed to load utilization data");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await ipamApi.getUtilizationSummary();
      if (response.error) {
        throw new Error(response.error);
      }
      setSummary(response.data as UtilizationSummary);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      case "moderate":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading utilization data...
        </CardContent>
      </Card>
    );
  }

  if (!utilization) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load utilization data
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Utilization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Hosts</div>
            <div className="text-2xl font-bold">{utilization.total_hosts.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Used IPs</div>
            <div className="text-2xl font-bold text-[oklch(0.40_0.15_249)]">
              {utilization.used_ips.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Available IPs</div>
            <div className="text-2xl font-bold text-green-600">
              {utilization.available_ips.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Utilization</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{utilization.utilization_percentage}%</div>
              <Badge variant={getStatusColor(utilization.status)}>{utilization.status}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>IP Address Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Assigned</div>
              <div className="text-xl font-semibold">{utilization.assigned_ips}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Reserved</div>
              <div className="text-xl font-semibold">{utilization.reserved_ips}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">DHCP</div>
              <div className="text-xl font-semibold">{utilization.dhcp_ips}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Deprecated</div>
              <div className="text-xl font-semibold">{utilization.deprecated_ips}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Available</div>
              <div className="text-xl font-semibold text-green-600">
                {utilization.available_ips}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utilization Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Utilization Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>0%</span>
              <span className="font-medium">{utilization.utilization_percentage}% Used</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  utilization.status === "critical"
                    ? "bg-red-500"
                    : utilization.status === "warning"
                      ? "bg-yellow-500"
                      : utilization.status === "moderate"
                        ? "bg-blue-500"
                        : "bg-green-500"
                }`}
                style={{ width: `${Math.min(100, utilization.utilization_percentage)}%` }}
              />
            </div>
            {utilization.status === "critical" && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Critical: Subnet is over 90% utilized</span>
              </div>
            )}
            {utilization.status === "warning" && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span>Warning: Subnet is over 75% utilized</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overall Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Overall Network Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Subnets</div>
                <div className="text-xl font-semibold">{summary.total_subnets}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Usable Hosts</div>
                <div className="text-xl font-semibold">
                  {summary.total_usable_hosts.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Used</div>
                <div className="text-xl font-semibold">{summary.total_used_ips.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overall Utilization</div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-semibold">
                    {summary.overall_utilization_percentage}%
                  </div>
                  <Badge variant={getStatusColor(summary.status)}>{summary.status}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Subnets by Status</div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Badge variant="destructive" className="w-full justify-center">
                    Critical: {summary.subnets_by_status.critical}
                  </Badge>
                </div>
                <div>
                  <Badge variant="default" className="w-full justify-center">
                    Warning: {summary.subnets_by_status.warning}
                  </Badge>
                </div>
                <div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Moderate: {summary.subnets_by_status.moderate}
                  </Badge>
                </div>
                <div>
                  <Badge variant="outline" className="w-full justify-center">
                    Healthy: {summary.subnets_by_status.healthy}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

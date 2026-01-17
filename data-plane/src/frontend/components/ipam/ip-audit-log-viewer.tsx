"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Filter, RefreshCw } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { IPAuditLog } from "@/types/ipam";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ipamApi = new IpamApiClient();

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
  assigned: "default",
  released: "outline",
  status_changed: "secondary",
  description_changed: "outline",
  subnet_changed: "secondary",
  tag_added: "default",
  tag_removed: "outline",
  note_added: "default",
  note_updated: "secondary",
  note_deleted: "destructive",
};

interface IPAuditLogViewerProps {
  ipAddressId?: number;
  ipAddress?: string;
  defaultFilters?: Record<string, unknown>;
}

export function IPAuditLogViewer({
  ipAddressId,
  ipAddress,
  defaultFilters = {},
}: IPAuditLogViewerProps) {
  const [logs, setLogs] = useState<IPAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: "all",
    user: "",
    start_date: "",
    end_date: "",
    limit: "100",
    ...defaultFilters,
  });

  useEffect(() => {
    loadLogs();
  }, [ipAddressId, ipAddress, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        limit: parseInt(filters.limit) || 100,
      };

      if (ipAddressId) {
        params.ip_address_id = ipAddressId;
      } else if (ipAddress) {
        params.ip_address = ipAddress;
      }

      if (filters.action && filters.action !== "all") {
        params.action = filters.action;
      }

      if (filters.user) {
        params.user = filters.user;
      }

      if (filters.start_date) {
        params.start_date = filters.start_date;
      }

      if (filters.end_date) {
        params.end_date = filters.end_date;
      }

      const response = await ipamApi.getIPAuditLogs(params);
      if (response.data) {
        setLogs(extractIpamArrayData<IPAuditLog>(response.data));
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, unknown> = {};
      if (ipAddressId) params.ip_address_id = ipAddressId;
      if (ipAddress) params.ip_address = ipAddress;
      if (filters.action && filters.action !== "all") params.action = filters.action;

      const blob = await ipamApi.exportIPAuditLogs(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ip-audit-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audit logs exported successfully");
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      toast.error("Failed to export audit logs");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Audit Log</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-filter">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger id="action-filter">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="status_changed">Status Changed</SelectItem>
                  <SelectItem value="description_changed">Description Changed</SelectItem>
                  <SelectItem value="subnet_changed">Subnet Changed</SelectItem>
                  <SelectItem value="tag_added">Tag Added</SelectItem>
                  <SelectItem value="tag_removed">Tag Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                type="number"
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
                min="1"
                max="1000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ip_address_str}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[log.action] || "outline"}>
                      {log.action_display}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.user_display}</TableCell>
                  <TableCell className="text-sm">
                    {log.field_name && (
                      <div>
                        <span className="font-medium">{log.field_name}:</span>{" "}
                        {log.old_value && (
                          <span className="text-red-600 line-through">{log.old_value}</span>
                        )}
                        {log.old_value && log.new_value && " → "}
                        {log.new_value && (
                          <span className="text-green-600">{log.new_value}</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.reason || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

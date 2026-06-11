"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { SeverityBadge } from "@/components/apps/monitoring/severity-badge";
import type { Event } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [valueFilter, setValueFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const params: Record<string, unknown> = {};
    if (sourceFilter !== "all") params.source = sourceFilter;
    if (valueFilter !== "all") params.value = valueFilter;
    if (severityFilter !== "all") params.severity = severityFilter;

    api.getEvents(params).then((res) => {
      if (res.data) setEvents(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  }, [sourceFilter, valueFilter, severityFilter, refreshKey]);

  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader currentPage="Events" />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="trigger">Trigger</SelectItem>
            <SelectItem value="discovery">Discovery</SelectItem>
            <SelectItem value="autoregistration">Autoregistration</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={valueFilter} onValueChange={setValueFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Value" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All values</SelectItem>
            <SelectItem value="problem">Problem</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="disaster">Disaster</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="information">Information</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={load}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Activity className="h-12 w-12 opacity-30" />
              <p className="text-sm">No events found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Ack</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(e.clock), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.source_display}</TableCell>
                    <TableCell>
                      <Badge variant={e.value === "problem" ? "destructive" : e.value === "ok" ? "outline" : "secondary"} className="text-xs">
                        {e.value_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.severity !== "not_classified" && <SeverityBadge severity={e.severity} />}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{e.host_name ?? "—"}</TableCell>
                    <TableCell className="text-sm max-w-[240px] truncate">{e.name || e.trigger_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={e.acknowledged ? "outline" : "secondary"} className="text-xs">
                        {e.acknowledged ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

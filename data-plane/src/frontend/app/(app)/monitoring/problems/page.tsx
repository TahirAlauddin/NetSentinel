"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { ProblemsTable } from "@/components/apps/monitoring/problems-table";
import { SeverityBadge } from "@/components/apps/monitoring/severity-badge";
import type { Problem, HostGroup, TriggerSeverity } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

const SEVERITIES: TriggerSeverity[] = [
  "disaster",
  "high",
  "average",
  "warning",
  "information",
  "not_classified",
];

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [hostGroups, setHostGroups] = useState<HostGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [ackFilter, setAckFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const params: Record<string, unknown> = {};
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (severityFilter !== "all") params.severity = severityFilter;
    if (ackFilter !== "all") params.acknowledged = ackFilter === "yes";
    if (groupFilter !== "all") params.host_group = groupFilter;

    Promise.all([api.getProblems(params), api.getHostGroups()]).then(([pRes, gRes]) => {
      if (pRes.data) setProblems(Array.isArray(pRes.data) ? pRes.data : []);
      if (gRes.data) setHostGroups(Array.isArray(gRes.data) ? gRes.data : []);
      setLoading(false);
    });

  }, [search, statusFilter, severityFilter, ackFilter, groupFilter, refreshKey]);

  const activeCount = problems.filter((p) => p.status === "active").length;
  const unackedCount = problems.filter(
    (p) => p.status === "active" && !p.acknowledged
  ).length;

  const countBySeverity = SEVERITIES.reduce<Record<string, number>>(
    (acc, sev) => {
      acc[sev] = problems.filter(
        (p) => p.severity === sev && p.status === "active"
      ).length;
      return acc;
    },
    {}
  );

  const hasFilters =
    search ||
    statusFilter !== "active" ||
    severityFilter !== "all" ||
    ackFilter !== "all" ||
    groupFilter !== "all";

  return (
    <div className="p-6 space-y-5">
      <MonitoringHeader currentPage="Problems" />

      {/* Severity summary chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSeverityFilter("all")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
            severityFilter === "all" && statusFilter === "active"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          <span className="text-base font-bold tabular-nums">{activeCount}</span>
          <span className="text-xs">Active</span>
        </button>

        {unackedCount > 0 && (
          <button
            onClick={() => setAckFilter(ackFilter === "no" ? "all" : "no")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              ackFilter === "no"
                ? "bg-orange-50 border-orange-300 text-orange-700"
                : "bg-background border-orange-200 text-orange-600 hover:border-orange-400"
            }`}
          >
            <span className="text-base font-bold tabular-nums">{unackedCount}</span>
            <span className="text-xs">Unacked</span>
          </button>
        )}

        <span className="h-5 w-px bg-border mx-1" aria-hidden />

        {SEVERITIES.map((sev) => {
          const count = countBySeverity[sev] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={sev}
              onClick={() =>
                setSeverityFilter(severityFilter === sev ? "all" : sev)
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                severityFilter === sev
                  ? "ring-2 ring-primary/30 shadow-sm"
                  : "hover:border-primary/30 opacity-80 hover:opacity-100"
              }`}
            >
              <span className="text-sm font-bold tabular-nums">{count}</span>
              <SeverityBadge severity={sev} showDot={false} />
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 h-9 w-52"
            placeholder="Search problems…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="disaster">Disaster</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="information">Information</SelectItem>
            <SelectItem value="not_classified">Not classified</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ackFilter} onValueChange={setAckFilter}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Acknowledged" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ack status</SelectItem>
            <SelectItem value="yes">Acknowledged</SelectItem>
            <SelectItem value="no">Unacknowledged</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Host Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {hostGroups.map((g) => (
              <SelectItem key={g.id} value={g.id.toString()}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={load}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() => {
              setSearch("");
              setStatusFilter("active");
              setSeverityFilter("all");
              setAckFilter("all");
              setGroupFilter("all");
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        )}

        {!loading && (
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {problems.length} problem{problems.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 animate-pulse"
                >
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted ml-auto" />
                </div>
              ))}
            </div>
          ) : problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm font-medium text-green-700">
                No problems found
              </p>
              <p className="text-xs text-muted-foreground">
                {hasFilters
                  ? "Try adjusting your filters."
                  : "Everything looks healthy."}
              </p>
            </div>
          ) : (
            <ProblemsTable problems={problems} onRefresh={load} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

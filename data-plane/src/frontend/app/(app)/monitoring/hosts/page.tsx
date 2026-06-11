"use client";

import { useState, useEffect, useCallback } from "react";

import Link from "next/link";

import { Plus, Search, RefreshCw, SlidersHorizontal } from "lucide-react";

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
import { HostGroupsPanel } from "@/components/apps/monitoring/host-groups-panel";
import { HostsTable } from "@/components/apps/monitoring/hosts-table";
import type { Host, HostGroup } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function HostsPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostGroups, setHostGroups] = useState<HostGroup[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(() => {
    setLoadingHosts(true);
    setLoadingGroups(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchHosts = async () => {
      const params: Record<string, unknown> = {};

      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (availabilityFilter !== "all") params.availability = availabilityFilter;
      if (selectedGroupId) params.host_group = selectedGroupId;

      const hostsRes = await api.getHosts(params);
      if (!isMounted) return;

      if (hostsRes.data) setHosts(Array.isArray(hostsRes.data) ? hostsRes.data : []);
      setLoadingHosts(false);
    };

    void fetchHosts();
    return () => {
      isMounted = false;
    };
  }, [search, statusFilter, availabilityFilter, selectedGroupId, refreshKey]);

  useEffect(() => {
    let isMounted = true;
    const fetchGroups = async () => {
      const groupsRes = await api.getHostGroups();
      if (!isMounted) return;

      if (groupsRes.data) {
        setHostGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      }

      setLoadingGroups(false);
    };

    void fetchGroups();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleSearchChange = (value: string) => {
    setLoadingHosts(true);
    setSearch(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setLoadingHosts(true);
    setStatusFilter(value);
  };

  const handleAvailabilityFilterChange = (value: string) => {
    setLoadingHosts(true);
    setAvailabilityFilter(value);
  };

  const handleGroupSelect = (groupId: string | null) => {
    setLoadingHosts(true);
    setSelectedGroupId(groupId);
  };

  const clearFilters = () => {
    setLoadingHosts(true);
    setSearch("");
    setStatusFilter("all");
    setAvailabilityFilter("all");
    setSelectedGroupId(null);
  };

  const hasFilters =
    search || statusFilter !== "all" || availabilityFilter !== "all" || selectedGroupId !== null;

  const selectedGroupName =
    selectedGroupId != null
      ? hostGroups.find((g) => g.id.toString() === selectedGroupId)?.name
      : null;

  return (
    <div className="p-6 space-y-5">
      <MonitoringHeader currentPage="Hosts" />

      <HostGroupsPanel
        groups={hostGroups}
        loading={loadingGroups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleGroupSelect}
        onRefresh={loadData}
      />

      {/* Hosts toolbar */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

            <Input
              className="pl-9 h-9 w-52"
              placeholder="Search hosts…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>

              <SelectItem value="monitored">Monitored</SelectItem>

              <SelectItem value="unmonitored">Not monitored</SelectItem>
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={handleAvailabilityFilterChange}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All availability</SelectItem>

              <SelectItem value="available">Available</SelectItem>

              <SelectItem value="unavailable">Unavailable</SelectItem>

              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingHosts || loadingGroups ? "animate-spin" : ""}`}
            />
          </Button>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!loadingHosts && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {hosts.length} host{hosts.length !== 1 ? "s" : ""}
              {selectedGroupName ? ` in ${selectedGroupName}` : ""}
            </span>
          )}

          <Button asChild size="sm">
            <Link href="/monitoring/hosts/add">
              <Plus className="h-4 w-4 mr-1.5" /> Add Host
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loadingHosts ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="h-4 w-32 rounded bg-muted" />

                  <div className="h-4 w-24 rounded bg-muted" />

                  <div className="h-4 w-20 rounded bg-muted ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <HostsTable hosts={hosts} onRefresh={loadData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Power, PowerOff, AlertTriangle, BarChart2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { AvailabilityBadge } from "@/components/apps/monitoring/availability-badge";
import { ProblemsTable } from "@/components/apps/monitoring/problems-table";
import { SeverityBadge } from "@/components/apps/monitoring/severity-badge";
import type { Host, Item, Trigger, Problem } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function HostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [host, setHost] = useState<Host | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHost = useCallback(async () => {
    const [hostRes, itemsRes, triggersRes, problemsRes] = await Promise.all([
      api.getHost(id),
      api.getHostItems(id),
      api.getHostTriggers(id),
      api.getHostProblems(id),
    ]);
    if (hostRes.data) setHost(hostRes.data);
    if (itemsRes.data) setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
    if (triggersRes.data) setTriggers(Array.isArray(triggersRes.data) ? triggersRes.data : []);
    if (problemsRes.data) setProblems(Array.isArray(problemsRes.data) ? problemsRes.data : []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // Fetching this page's data when the route id changes — the standard
    // "sync with an external system" (the API) effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHost();
  }, [loadHost]);

  const handleDelete = async () => {
    if (!confirm("Delete this host? This action cannot be undone.")) return;
    const res = await api.deleteHost(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Host deleted.");
      router.push("/monitoring/hosts");
    }
  };

  const handleToggle = async () => {
    if (!host) return;
    const res =
      host.status === "monitored"
        ? await api.disableHost(id)
        : await api.enableHost(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Host ${host.status === "monitored" ? "disabled" : "enabled"}.`);
      loadHost();
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground text-sm animate-pulse">Loading host…</div>
    );
  }

  if (!host) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Host not found.{" "}
        <Link href="/monitoring/hosts" className="underline">
          Back to hosts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader
        currentPage={host.visible_name || host.name}
        breadcrumbs={[
          { label: "Monitoring", href: "/monitoring" },
          { label: "Hosts", href: "/monitoring/hosts" },
          { label: host.visible_name || host.name },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/monitoring/hosts/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleToggle}>
          {host.status === "monitored" ? (
            <>
              <PowerOff className="h-4 w-4 mr-1.5" /> Disable
            </>
          ) : (
            <>
              <Power className="h-4 w-4 mr-1.5" /> Enable
            </>
          )}
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={host.status === "monitored" ? "default" : "secondary"}>
              {host.status_display}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Availability</p>
            <AvailabilityBadge availability={host.availability} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="font-mono text-sm">{host.display_address || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Active Problems</p>
            <p className={`text-2xl font-bold ${host.problem_count > 0 ? "text-red-600" : "text-green-600"}`}>
              {host.problem_count}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="problems">
        <TabsList>
          <TabsTrigger value="problems" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Problems ({problems.length})
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-1.5">
            <BarChart2 className="h-4 w-4" />
            Items ({items.length})
          </TabsTrigger>
          <TabsTrigger value="triggers" className="gap-1.5">
            <Zap className="h-4 w-4" />
            Triggers ({triggers.length})
          </TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ProblemsTable problems={problems} onRefresh={loadHost} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No items configured for this host.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Key</th>
                      <th className="px-4 py-2 text-left font-medium">Type</th>
                      <th className="px-4 py-2 text-left font-medium">Interval</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium">{item.name}</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.key}</td>
                        <td className="px-4 py-2 text-muted-foreground">{item.item_type_display}</td>
                        <td className="px-4 py-2 text-muted-foreground">{item.delay}</td>
                        <td className="px-4 py-2">
                          <Badge variant={item.status === "enabled" ? "default" : "secondary"} className="text-xs">
                            {item.status_display}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {triggers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No triggers configured for this host.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Severity</th>
                      <th className="px-4 py-2 text-left font-medium">State</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {triggers.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium">{t.name}</td>
                        <td className="px-4 py-2">
                          <SeverityBadge severity={t.severity} />
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={t.state === "problem" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {t.state_display}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={t.status === "enabled" ? "default" : "secondary"} className="text-xs">
                            {t.status_display}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {[
                  { label: "Location", value: host.location },
                  { label: "OS", value: host.os },
                  { label: "Hardware", value: host.hardware },
                  { label: "Vendor", value: host.vendor },
                  { label: "Model", value: host.model },
                  { label: "Serial Number", value: host.serial_number },
                  { label: "Asset Tag", value: host.asset_tag },
                  { label: "Software", value: host.software },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-0.5">
                    <dt className="text-xs text-muted-foreground font-medium">{label}</dt>
                    <dd className="font-medium">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

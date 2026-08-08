"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Host, HostGroup, Template, Proxy } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

const hostSchema = z.object({
  name: z.string().min(1, "Technical name is required"),
  visible_name: z.string().optional(),
  description: z.string().optional(),
  ip_address: z.string().optional(),
  dns_name: z.string().optional(),
  use_dns: z.boolean().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  status: z.enum(["monitored", "unmonitored"]).optional(),
  inventory_mode: z.enum(["disabled", "manual", "automatic"]).optional(),
  snmp_version: z.enum(["v1", "v2c", "v3", "none"]).optional(),
  snmp_community: z.string().optional(),
  snmp_port: z.number().int().optional(),
  location: z.string().optional(),
  os: z.string().optional(),
  hardware: z.string().optional(),
  serial_number: z.string().optional(),
  asset_tag: z.string().optional(),
  model: z.string().optional(),
  vendor: z.string().optional(),
});

type HostFormValues = z.infer<typeof hostSchema>;

function snmpVersionFromHost(host?: Host): "none" | "v1" | "v2c" | "v3" {
  const v = host?.snmp_version;
  if (v === "v1" || v === "v2c" || v === "v3") return v;
  return "none";
}

interface HostFormProps {
  host?: Host;
  isEdit?: boolean;
}

export function HostForm({ host, isEdit = false }: HostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hostGroups, setHostGroups] = useState<HostGroup[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>(host?.host_groups ?? []);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>(host?.templates ?? []);
  const [selectedProxy, setSelectedProxy] = useState<number | null>(host?.proxy ?? null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      name: host?.name ?? "",
      visible_name: host?.visible_name ?? "",
      description: host?.description ?? "",
      ip_address: host?.ip_address ?? "",
      dns_name: host?.dns_name ?? "",
      use_dns: host?.use_dns ?? false,
      port: host?.port ?? 10050,
      status: host?.status ?? "monitored",
      inventory_mode: host?.inventory_mode ?? "disabled",
      snmp_version: snmpVersionFromHost(host),
      snmp_community: host?.snmp_community ?? "",
      snmp_port: host?.snmp_port ?? 161,
      location: host?.location ?? "",
      os: host?.os ?? "",
      hardware: host?.hardware ?? "",
      serial_number: host?.serial_number ?? "",
      asset_tag: host?.asset_tag ?? "",
      model: host?.model ?? "",
      vendor: host?.vendor ?? "",
    },
  });

  const useDns = useWatch({ control, name: "use_dns" });
  const snmpVersion = useWatch({ control, name: "snmp_version" });

  useEffect(() => {
    (async () => {
      const [hg, tpl, px] = await Promise.all([
        api.getHostGroups(),
        api.getTemplates(),
        api.getProxies(),
      ]);
      if (hg.data) setHostGroups(Array.isArray(hg.data) ? hg.data : []);
      if (tpl.data) setTemplates(Array.isArray(tpl.data) ? tpl.data : []);
      if (px.data) setProxies(Array.isArray(px.data) ? px.data : []);
    })();
  }, []);

  const toggleGroup = (id: number) =>
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const toggleTemplate = (id: number) =>
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const onSubmit = async (values: HostFormValues) => {
    setLoading(true);
    const { snmp_version, ...rest } = values;
    const payload = {
      ...rest,
      snmp_version: snmp_version === "none" ? ("" as const) : snmp_version,
      host_groups: selectedGroups,
      templates: selectedTemplates,
      proxy: selectedProxy,
    };

    const res = isEdit && host
      ? await api.updateHost(host.id, payload)
      : await api.createHost(payload as Parameters<typeof api.createHost>[0]);

    setLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(isEdit ? "Host updated." : "Host created.");
      router.push("/monitoring/hosts");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <Tabs defaultValue="host">
        <TabsList className="mb-4">
          <TabsTrigger value="host">Host</TabsTrigger>
          <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="macros">Macros / Tags</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="encryption">Encryption</TabsTrigger>
        </TabsList>

        {/* ── Host tab ── */}
        <TabsContent value="host" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Host Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Host name <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register("name")} placeholder="web-server-01" />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visible_name">Visible name</Label>
                <Input
                  id="visible_name"
                  {...register("visible_name")}
                  placeholder="Web Server 01 (optional)"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  defaultValue={host?.status ?? "monitored"}
                  onValueChange={(v) => setValue("status", v as "monitored" | "unmonitored")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitored">Monitored</SelectItem>
                    <SelectItem value="unmonitored">Not monitored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Inventory mode</Label>
                <Select
                  defaultValue={host?.inventory_mode ?? "disabled"}
                  onValueChange={(v) => setValue("inventory_mode", v as "disabled" | "manual" | "automatic")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Host Groups</CardTitle>
              <CardDescription>Assign host to one or more groups.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {hostGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedGroups.includes(g.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
                {hostGroups.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No host groups yet.{" "}
                    <a href="/monitoring/hosts" className="underline">
                      Create one
                    </a>
                    .
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proxy</CardTitle>
              <CardDescription>
                Optionally monitor this host via a distributed proxy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                defaultValue={selectedProxy?.toString() ?? "none"}
                onValueChange={(v) => setSelectedProxy(v === "none" ? null : Number(v))}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="No proxy (direct)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No proxy (direct)</SelectItem>
                  {proxies.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Interfaces tab ── */}
        <TabsContent value="interfaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="use_dns"
                  checked={useDns}
                  onCheckedChange={(v) => setValue("use_dns", v)}
                />
                <Label htmlFor="use_dns">Connect via DNS name</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {useDns ? (
                  <div className="space-y-1.5">
                    <Label>DNS name</Label>
                    <Input {...register("dns_name")} placeholder="host.example.com" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>IP address</Label>
                    <Input {...register("ip_address")} placeholder="192.168.1.1" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    {...register("port", { valueAsNumber: true })}
                    placeholder="10050"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SNMP Interface</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>SNMP version</Label>
                <Select
                  defaultValue={snmpVersionFromHost(host)}
                  onValueChange={(v) =>
                    setValue("snmp_version", v as "none" | "v1" | "v2c" | "v3")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="v1">SNMPv1</SelectItem>
                    <SelectItem value="v2c">SNMPv2c</SelectItem>
                    <SelectItem value="v3">SNMPv3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(snmpVersion === "v1" || snmpVersion === "v2c") && (
                <div className="space-y-1.5">
                  <Label>Community string</Label>
                  <Input {...register("snmp_community")} placeholder="public" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>SNMP port</Label>
                <Input
                  type="number"
                  {...register("snmp_port", { valueAsNumber: true })}
                  placeholder="161"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Templates tab ── */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linked Templates</CardTitle>
              <CardDescription>
                Templates provide items, triggers, and graphs for this host.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTemplate(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedTemplates.includes(t.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No templates yet.{" "}
                    <a href="/monitoring/templates" className="underline">
                      Create one
                    </a>
                    .
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory tab ── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Host Inventory</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "location", label: "Location" },
                { id: "os", label: "Operating System" },
                { id: "hardware", label: "Hardware" },
                { id: "vendor", label: "Vendor" },
                { id: "model", label: "Model" },
                { id: "serial_number", label: "Serial Number" },
                { id: "asset_tag", label: "Asset Tag" },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    {...register(id as keyof HostFormValues)}
                    placeholder={label}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Macros tab (placeholder) ── */}
        <TabsContent value="macros">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Tag management will be available here.
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Encryption tab (placeholder) ── */}
        <TabsContent value="encryption">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              TLS encryption settings will be available here.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Update Host" : "Add Host"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

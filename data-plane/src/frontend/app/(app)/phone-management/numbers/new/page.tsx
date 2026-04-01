"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { UserApiClient } from "@/lib/api-client/user";
import type { ManagedPhoneNumberCreateDto } from "@/types/phone-management";
import type { LocationRecord } from "@/types/locations";
import type { UserRecord } from "@/types/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MANAGED_PHONE_SERVICE_TYPES } from "@/types/phone-management";
import { toast } from "sonner";

async function loadLocations(): Promise<LocationRecord[]> {
  const api = new InfrastructureApiClient();
  const res = await api.getLocations<LocationRecord[] | { results: LocationRecord[] }>({});
  if (res.error || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as { results: LocationRecord[] }).results ?? [];
}

async function loadUsers(): Promise<UserRecord[]> {
  const api = new UserApiClient();
  const res = await api.getUsers<UserRecord[] | { results: UserRecord[] }>({});
  if (res.error || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as { results: UserRecord[] }).results ?? [];
}

export default function NewManagedNumberPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [didEnabled, setDidEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const [locs, usrs] = await Promise.all([loadLocations(), loadUsers()]);
      setLocations(locs);
      setUsers(usrs);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const svcType = (fd.get("service_type") as string) as ManagedPhoneNumberCreateDto["service_type"];
    const didEnabled = fd.get("did_enabled") === "on";
    const numberVal = (fd.get("number") as string)?.trim() || "";
    const data: ManagedPhoneNumberCreateDto = {
      number: numberVal,
      location: Number(fd.get("location")),
      assigned_user: fd.get("assigned_user") ? Number(fd.get("assigned_user")) : null,
      name: (fd.get("name") as string)?.trim() || "",
      extension_number: (fd.get("extension_number") as string)?.trim() || null,
      service_type: svcType,
      did_enabled: didEnabled,
      did_external_number: didEnabled
        ? ((fd.get("did_external_number") as string)?.trim() || null)
        : null,
      notes: (fd.get("notes") as string)?.trim() || null,
    };
    if (!data.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!data.number || !data.location) {
      toast.error("Phone number and location are required. Location indicates where the phone is based.");
      return;
    }
    setSubmitting(true);
    try {
      const api = new PhoneManagementApiClient();
      const res = await api.createManagedNumber(data);
      if (res.error || !res.data) {
        toast.error(res.error || "Failed to create managed number");
        return;
      }
      toast.success("Managed number created");
      router.push("/phone-management/numbers");
      router.refresh();
    } catch (_e) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="phone_management.add_managedphonenumber">
        <AppShell>
          <div className="flex-1 p-6">Loading…</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="phone_management.add_managedphonenumber">
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Phone Management", href: "/phone-management" },
              { label: "Managed Numbers", href: "/phone-management/numbers" },
              { label: "New" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Add managed number</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add a phone number with location, service type, and optional extension or DID.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Managed number details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">
                      Phone number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="number"
                      name="number"
                      required
                      placeholder="e.g. +1-312-273-2048"
                      maxLength={32}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">
                      Location <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="location"
                      name="location"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g. Reception desk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service type</Label>
                    <select
                      id="service_type"
                      name="service_type"
                      defaultValue="extension"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {MANAGED_PHONE_SERVICE_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="extension_number">Extension number</Label>
                    <Input
                      id="extension_number"
                      name="extension_number"
                      placeholder="1–10 digits"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_user">Assigned user</Label>
                    <select
                      id="assigned_user"
                      name="assigned_user"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">None</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="did_enabled"
                    name="did_enabled"
                    checked={didEnabled}
                    onCheckedChange={(checked) => setDidEnabled(checked === true)}
                  />
                  <Label htmlFor="did_enabled">DID enabled</Label>
                </div>
                {didEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="did_external_number">DID external number</Label>
                    <Input
                      id="did_external_number"
                      name="did_external_number"
                      placeholder="When DID is enabled"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : "Add managed number"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/phone-management/numbers">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

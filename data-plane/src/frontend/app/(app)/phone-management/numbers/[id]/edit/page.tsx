"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { UserApiClient } from "@/lib/api-client/user";
import type {
  ManagedPhoneNumberRecord,
  ManagedPhoneNumberCreateDto,
} from "@/types/phone-management";
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

export default function EditManagedNumberPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [record, setRecord] = useState<ManagedPhoneNumberRecord | null>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const api = new PhoneManagementApiClient();
      const res = await api.getManagedNumber<ManagedPhoneNumberRecord>(id);
      if (res.data) setRecord(res.data);
      const [locs, usrs] = await Promise.all([loadLocations(), loadUsers()]);
      setLocations(locs);
      setUsers(usrs);
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!record) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const didEnabled = fd.get("did_enabled") === "on";
    const serviceType = (fd.get("service_type") as string) as ManagedPhoneNumberCreateDto["service_type"];
    const data: Partial<ManagedPhoneNumberCreateDto> = {
      number: (fd.get("number") as string)?.trim() || record.number,
      location: Number(fd.get("location")),
      assigned_user: fd.get("assigned_user")
        ? Number(fd.get("assigned_user"))
        : null,
      name: (fd.get("name") as string)?.trim() || "",
      extension_number: (fd.get("extension_number") as string)?.trim() || null,
      service_type: serviceType,
      did_enabled: didEnabled,
      did_external_number: didEnabled
        ? ((fd.get("did_external_number") as string)?.trim() || null)
        : null,
      notes: (fd.get("notes") as string)?.trim() || null,
    };
    if (!data.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    const locationId = Number(fd.get("location"));
    if (!locationId || Number.isNaN(locationId)) {
      toast.error("Location is required so we know where this phone is located.");
      return;
    }
    setSubmitting(true);
    try {
      const api = new PhoneManagementApiClient();
      const res = await api.updateManagedNumber(id, data);
      if (res.error) {
        toast.error(res.error || "Failed to update");
        return;
      }
      toast.success("Managed number updated");
      router.push(`/phone-management/numbers/${id}`);
      router.refresh();
    } catch (_e) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !record) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">
            {loading ? "Loading…" : "Managed number not found."}
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Phone Management", href: "/phone-management" },
              { label: "Managed Numbers", href: "/phone-management/numbers" },
              { label: record.name, href: `/phone-management/numbers/${record.id}` },
              { label: "Edit" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Edit managed number</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Update extension, service type, and assignment.
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
                    <Label htmlFor="number">Phone number *</Label>
                    <Input
                      id="number"
                      name="number"
                      required
                      defaultValue={record.number}
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
                      defaultValue={record.location}
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
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={record.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service type</Label>
                    <select
                      id="service_type"
                      name="service_type"
                      defaultValue={record.service_type}
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
                      defaultValue={record.extension_number ?? ""}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_user">Assigned user</Label>
                    <select
                      id="assigned_user"
                      name="assigned_user"
                      defaultValue={record.assigned_user ?? ""}
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
                    defaultChecked={record.did_enabled}
                  />
                  <Label htmlFor="did_enabled">DID enabled</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="did_external_number">DID external number</Label>
                  <Input
                    id="did_external_number"
                    name="did_external_number"
                    defaultValue={record.did_external_number ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    defaultValue={record.notes ?? ""}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : "Save changes"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/phone-management/numbers/${id}`}>Cancel</Link>
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

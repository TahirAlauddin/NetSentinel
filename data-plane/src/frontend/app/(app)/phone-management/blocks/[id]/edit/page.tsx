"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import type {
  ManagedPhoneNumberBlockRecord,
  ManagedPhoneNumberBlockCreateDto,
} from "@/types/phone-management";
import type { LocationRecord } from "@/types/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

async function loadLocations(): Promise<LocationRecord[]> {
  const api = new InfrastructureApiClient();
  const res = await api.getLocations<LocationRecord[] | { results: LocationRecord[] }>({});
  if (res.error || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as { results: LocationRecord[] }).results ?? [];
}

/**
 * Edit managed block page - edits a managed block.
 */
export default function EditManagedBlockPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [record, setRecord] = useState<ManagedPhoneNumberBlockRecord | null>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const api = new PhoneManagementApiClient();
      const res = await api.getManagedBlock<ManagedPhoneNumberBlockRecord>(id);
      if (res.data) setRecord(res.data);
      setLocations(await loadLocations());
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!record) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: Partial<ManagedPhoneNumberBlockCreateDto> = {
      location: Number(fd.get("location")),
      name: (fd.get("name") as string)?.trim() || "",
      start_number: (fd.get("start_number") as string)?.trim() || "",
      end_number: (fd.get("end_number") as string)?.trim() || "",
      is_static_assignment: fd.get("is_static_assignment") === "on",
      notes: (fd.get("notes") as string)?.trim() || null,
    };
    if (!data.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const api = new PhoneManagementApiClient();
      const res = await api.updateManagedBlock(id, data);
      if (res.error) {
        toast.error(res.error || "Failed to update");
        return;
      }
      toast.success("Number block updated");
      router.push(`/phone-management/blocks/${id}`);
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
            {loading ? "Loading…" : "Number block not found."}
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
              { label: "Number Blocks", href: "/phone-management/blocks" },
              { label: record.name, href: `/phone-management/blocks/${record.id}` },
              { label: "Edit" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Edit number block</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Update name, range, and assignment.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Number block details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Label htmlFor="location">Location</Label>
                    <select
                      id="location"
                      name="location"
                      required
                      defaultValue={record.location}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
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
                    <Label htmlFor="start_number">Start number *</Label>
                    <Input
                      id="start_number"
                      name="start_number"
                      required
                      defaultValue={record.start_number}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_number">End number *</Label>
                    <Input
                      id="end_number"
                      name="end_number"
                      required
                      defaultValue={record.end_number}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_static_assignment"
                    name="is_static_assignment"
                    defaultChecked={record.is_static_assignment}
                  />
                  <Label htmlFor="is_static_assignment">Static assignment</Label>
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
                    <Link href={`/phone-management/blocks/${id}`}>Cancel</Link>
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

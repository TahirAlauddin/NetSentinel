"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import type { ManagedPhoneNumberBlockCreateDto } from "@/types/phone-management";
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

export default function NewManagedBlockPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLocations(await loadLocations());
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: ManagedPhoneNumberBlockCreateDto = {
      location: Number(fd.get("location")),
      name: (fd.get("name") as string)?.trim() || "",
      start_number: (fd.get("start_number") as string)?.trim() || "",
      end_number: (fd.get("end_number") as string)?.trim() || "",
      is_static_assignment: fd.get("is_static_assignment") === "on",
      notes: (fd.get("notes") as string)?.trim() || null,
    };
    if (!data.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!data.location || !data.start_number || !data.end_number) {
      toast.error("Location, start number, and end number are required");
      return;
    }
    setSubmitting(true);
    try {
      const api = new PhoneManagementApiClient();
      const res = await api.createManagedBlock(data);
      if (res.error || !res.data) {
        toast.error(res.error || "Failed to create number block");
        return;
      }
      toast.success("Number block created");
      router.push("/phone-management/blocks");
      router.refresh();
    } catch (_e) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">Loading…</div>
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
              { label: "New" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Add number block</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Define a range of numbers at a location.
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
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g. Building A main block"
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
                    <Label htmlFor="start_number">
                      Start number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="start_number"
                      name="start_number"
                      required
                      placeholder="e.g. 5550100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_number">
                      End number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="end_number"
                      name="end_number"
                      required
                      placeholder="e.g. 5550199"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="is_static_assignment" name="is_static_assignment" defaultChecked />
                  <Label htmlFor="is_static_assignment">Static assignment</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : "Add number block"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/phone-management/blocks">Cancel</Link>
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

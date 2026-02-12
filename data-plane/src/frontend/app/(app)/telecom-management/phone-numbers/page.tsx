"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import type { PhoneNumberRecord } from "@/types/phone-numbers";
import { Search, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneNumberListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PhoneNumberRecord[];
}

async function fetchPhoneNumbers(
  api: TelecomApiClient,
  search?: string
): Promise<PhoneNumberListResponse> {
  const params: Record<string, unknown> = {};
  if (search?.trim()) params.search = search.trim();
  const res = await api.getPhoneNumbers<PhoneNumberListResponse | PhoneNumberRecord[]>(params);
  if (res.error || !res.data) {
    return { count: 0, next: null, previous: null, results: [] };
  }
  const data = res.data;
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data as PhoneNumberListResponse;
}

function formatPhoneDisplay(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return number;
}

export default function PhoneNumbersPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PhoneNumberListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const api = useMemo(() => new TelecomApiClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchPhoneNumbers(api, search);
    setData(result);
    setLoading(false);
  }, [api, search]);

  useEffect(() => {
    if (!session) return;
    const tid = setTimeout(() => load(), 0);
    return () => clearTimeout(tid);
  }, [session, load]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const allResults = useMemo(() => data?.results ?? [], [data?.results]);
  const total = allResults.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const results = useMemo(
    () =>
      allResults.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [allResults, currentPage, itemsPerPage]
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Phone Numbers" },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Phone Numbers</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your phone numbers and assignments.
              </p>
            </div>
            <Button asChild>
              <Link href="/telecom-management/phone-numbers/new" className="gap-2">
                <Plus className="w-4 h-4" />
                Add phone number
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>Phone Numbers</CardTitle>
                {!loading && (
                  <span className="text-sm text-muted-foreground">
                    {total} total
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row gap-4 mb-4"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by number or friendly name..."
                    className="pl-10"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    aria-label="Search phone numbers"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Results per page
                  </span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>

              {error && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading…
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No phone numbers found.{" "}
                  <Link
                    href="/telecom-management/phone-numbers/new"
                    className="text-primary hover:underline"
                  >
                    Add a phone number
                  </Link>
                  .
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
                          <th className="px-4 py-3">Phone Number</th>
                          <th className="px-4 py-3">Friendly Name</th>
                          <th className="px-4 py-3">Provider</th>
                          <th className="px-4 py-3">Service</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              {formatPhoneDisplay(row.number)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {row.friendly_name ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {row.provider != null ? (
                                <Link
                                  href={`/telecom-management/providers/${row.provider}`}
                                  className="text-primary hover:underline"
                                >
                                  {row.provider_name ?? "—"}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {row.service != null ? (
                                <Link
                                  href={`/telecom-management/services/${row.service}`}
                                  className="text-primary hover:underline"
                                >
                                  {row.service_display ?? "—"}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {row.location_name ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                              {row.notes ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1}–
                        {Math.min(currentPage * itemsPerPage, total)} of {total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

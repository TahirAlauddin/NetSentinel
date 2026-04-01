"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import type { ManagedPhoneNumberRecord } from "@/types/phone-management";
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

interface ListResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: ManagedPhoneNumberRecord[];
}

async function fetchNumbers(
  api: PhoneManagementApiClient,
  search?: string
): Promise<ListResponse> {
  const params: Record<string, unknown> = {};
  if (search?.trim()) params.search = search.trim();
  const res = await api.getManagedNumbers<ListResponse | ManagedPhoneNumberRecord[]>(params);
  if (res.error || !res.data) {
    return { results: [] };
  }
  const data = res.data;
  if (Array.isArray(data)) {
    return { results: data };
  }
  return data as ListResponse;
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

export default function ManagedNumbersPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const api = useMemo(() => new PhoneManagementApiClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchNumbers(api, search);
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
    <ProtectedRoute requiredPermission="phone_management.view_managedphonenumber">
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Phone Management", href: "/phone-management" },
              { label: "Managed Numbers" },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Managed Numbers</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Individual phone numbers with extension, service type, and assignment.
              </p>
            </div>
            <Button asChild>
              <Link href="/phone-management/numbers/new" className="gap-2">
                <Plus className="w-4 h-4" />
                Add managed number
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>Managed Numbers</CardTitle>
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
                    placeholder="Search by name, extension, or number..."
                    className="pl-10"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    aria-label="Search managed numbers"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Per page
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

              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading…
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No managed numbers found.{" "}
                  <Link
                    href="/phone-management/numbers/new"
                    className="text-primary hover:underline"
                  >
                    Add a managed number
                  </Link>
                  .
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
                          <th className="px-4 py-3">Number</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Service Type</th>
                          <th className="px-4 py-3">Extension</th>
                          <th className="px-4 py-3">Assigned To</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              <Link
                                href={`/phone-management/numbers/${row.id}`}
                                className="text-primary hover:underline"
                              >
                                {formatPhoneDisplay(row.phone_number_value)}
                              </Link>
                            </td>
                            <td className="px-4 py-3">{row.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {row.location_name ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {row.service_type_display ?? row.service_type}
                            </td>
                            <td className="px-4 py-3">
                              {row.extension_number ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {row.assigned_user_name ?? "—"}
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
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
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

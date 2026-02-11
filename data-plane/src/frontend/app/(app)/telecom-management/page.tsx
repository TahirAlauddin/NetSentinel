"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Network, Building2, ArrowRight, ExternalLink } from "lucide-react";
import { DataCircuitRecord } from "@/types/data-circuits";
import { TelecomApiClient } from "@/lib/api-client/telecom";

async function listDataCircuits(): Promise<DataCircuitRecord[]> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.getDataCircuits<
    DataCircuitRecord[] | { results: DataCircuitRecord[] }
  >();
  
  if (response.status === 401) {
    throw new Error("Authentication required. Please log in.");
  }
  
  if (response.error || !response.data) {
    return [];
  }

  const data = response.data;

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: DataCircuitRecord[] }).results)
  ) {
    return (data as { results: DataCircuitRecord[] }).results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export default function TelecomExpenseManagementPage() {
  const { data: session } = useSession();
  const [circuits, setCircuits] = useState<DataCircuitRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCircuits() {
      if (!session) {
        return;
      }

      try {
        setLoading(true);
        const circuitList = await listDataCircuits();
        // Show only first 5 circuits as preview
        setCircuits(Array.isArray(circuitList) ? circuitList.slice(0, 5) : []);
      } catch (error) {
        console.error("Failed to fetch circuits:", error);
        setCircuits([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCircuits();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-8">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-semibold mb-2">Telecom Expense Management</h1>
              <p className="text-muted-foreground">
                Track and manage your telecom expenses, providers, circuits, invoices, and billing information.
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/telecom-management/providers"
                className="bg-card border border-border rounded-lg p-4 hover:border-red-500 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-red-500/10">
                      <Building2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Providers</h3>
                      <p className="text-xs text-muted-foreground">Manage providers</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </div>
              </Link>

              <Link
                href="/telecom-management/data-circuits"
                className="bg-card border border-border rounded-lg p-4 hover:border-red-500 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-red-500/10">
                      <Network className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Data Circuits</h3>
                      <p className="text-xs text-muted-foreground">Manage circuits</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </div>
              </Link>

              <div className="bg-card border border-border rounded-lg p-4 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Invoices</h3>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Circuits Preview Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Data Circuits Preview</h2>
                  <p className="text-sm text-muted-foreground">
                    Recent data circuits linked to expenses
                  </p>
                </div>
                <Link
                  href="/telecom-management/data-circuits"
                  className="text-sm text-red-500 hover:underline flex items-center gap-1"
                >
                  View All
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading circuits...
                </div>
              ) : circuits.length > 0 ? (
                <div className="space-y-3">
                  {circuits.map((circuit) => (
                    <div
                      key={circuit.id}
                      className="border border-border rounded-md p-4 hover:bg-[oklch(0.98_0_0)] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm">
                              {circuit.circuit_id || circuit.alternate_cid || `Circuit #${circuit.id}`}
                            </h3>
                            {circuit.circuit_type_display && (
                              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                {circuit.circuit_type_display}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                            {circuit.provider_name && (
                              <div>
                                <span className="font-medium">Provider:</span> {circuit.provider_name}
                              </div>
                            )}
                            {circuit.carrier && (
                              <div>
                                <span className="font-medium">Carrier:</span> {circuit.carrier}
                              </div>
                            )}
                            {circuit.location_name && (
                              <div>
                                <span className="font-medium">Location:</span> {circuit.location_name}
                              </div>
                            )}
                            {circuit.line_speed_display && (
                              <div>
                                <span className="font-medium">Speed:</span> {circuit.line_speed_display}
                              </div>
                            )}
                            {circuit.contract_id && (
                              <div>
                                <span className="font-medium">Contract:</span> {circuit.contract_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p className="mb-2">No data circuits found</p>
                  <Link
                    href="/telecom-management/data-circuits"
                    className="text-red-500 hover:underline"
                  >
                    Create your first data circuit
                  </Link>
                </div>
              )}
            </div>

            {/* Placeholder Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Expense Summary</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Overview of telecom expenses and costs.
                </p>
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Coming soon
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Recent Invoices</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Latest invoice entries and billing information.
                </p>
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}


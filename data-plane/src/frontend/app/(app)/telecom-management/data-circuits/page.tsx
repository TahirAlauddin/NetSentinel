"use client";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import { DataCircuitRecord, DataCircuitCreateDto } from "@/types/data-circuits";
import { useDataCircuits } from "@/hooks/useDataCircuits";
import { DataCircuitAddForm } from "@/components/apps/telecom/data-circuit-add-form";
import { DataCircuitEditRow } from "@/components/apps/telecom/data-circuit-edit-row";

export default function DataCircuitsPage() {
  const {
    dataCircuits,
    locations,
    providers,
    submitting,
    createDataCircuit,
    deleteDataCircuit,
    updateDataCircuit,
  } = useDataCircuits();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleDeleteDataCircuitConfirm = async (id: number) => {
    if (!confirm("Are you sure you want to delete this data circuit?")) return;
    await deleteDataCircuit(id);
  };

  const handleStartEdit = (circuit: DataCircuitRecord) => {
    setEditingId(circuit.id);
  };

  const handleSaveEdit = async (id: number, payload: DataCircuitCreateDto) => {
    const success = await updateDataCircuit(id, payload);
    if (success) {
      setEditingId(null);
    }
    return success;
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Data Circuits" },
            ]}
          />
          <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Data Circuits</h1>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? "Cancel" : "Add Data Circuit"}
              </button>
            </div>

            {showAddForm && (
              <DataCircuitAddForm
                providers={providers}
                locations={locations}
                submitting={submitting}
                onSubmit={async (data) => {
                  const success = await createDataCircuit(data);
                  if (success) {
                    setShowAddForm(false);
                  }
                  return success;
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            <div>
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                {dataCircuits.length > 0 ? (
                  <div className="divide-y divide-border">
                    {dataCircuits.map((circuit) => (
                      <div
                        key={circuit.id}
                        className="p-4 hover:bg-[oklch(0.98_0_0)]"
                      >
                        {editingId === circuit.id ? (
                          <DataCircuitEditRow
                            circuit={circuit}
                            providers={providers}
                            locations={locations}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-[oklch(0.40_0.15_249)] mb-2">
                                {circuit.circuit_id || circuit.alternate_cid || `Circuit #${circuit.id}`}
                              </h3>
                              <div className="text-xs text-muted-foreground space-y-1">
                                        {circuit.provider_name && (
                                          <p>
                                            <span className="font-medium">Provider:</span> {circuit.provider_name}
                                          </p>
                                        )}
                                        {circuit.carrier && (
                                          <p>
                                            <span className="font-medium">Carrier:</span> {circuit.carrier}
                                          </p>
                                        )}
                                        {circuit.location_name && (
                                          <p>
                                            <span className="font-medium">Location:</span> {circuit.location_name}
                                          </p>
                                        )}
                                {circuit.circuit_type_display && (
                                  <p>
                                    <span className="font-medium">Type:</span> {circuit.circuit_type_display}
                                  </p>
                                )}
                                {circuit.line_speed_display && (
                                  <p>
                                    <span className="font-medium">Line Speed:</span> {circuit.line_speed_display}
                                  </p>
                                )}
                                {circuit.port_speed && (
                                  <p>
                                    <span className="font-medium">Port Speed:</span> {circuit.port_speed}
                                  </p>
                                )}
                                {circuit.handoff_type_display && (
                                  <p>
                                    <span className="font-medium">Handoff:</span> {circuit.handoff_type_display}
                                    {circuit.fiber_type_display && ` (${circuit.fiber_type_display})`}
                                    {circuit.connector_type_display && ` - ${circuit.connector_type_display}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleStartEdit(circuit)}
                                className="p-1 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDataCircuitConfirm(circuit.id)}
                                className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No data circuits found
                  </div>
                )}
              </div>
            </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}


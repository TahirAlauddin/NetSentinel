"use client";

import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { SettingsNavTabs } from "@/components/settings-nav-tabs";
import { SettingsHeader } from "@/components/settings-header";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddLocationForm from "@/components/add-location-form";
import { LocationRecord } from "@/types/locations";
import { api } from "@/lib/utils";
import LocationMap from "@/components/location-map";

async function listLocations(): Promise<LocationRecord[]> {
  const response = await api.get<
    LocationRecord[] | { results: LocationRecord[] }
  >("/infrastructure/locations/");
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch locations");
  }

  const data = response.data;

  // Handle paginated response (if the API returns { results: [...] })
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as any).results)
  ) {
    return (data as any).results;
  }

  // Handle direct array response
  if (Array.isArray(data)) {
    return data;
  }

  // If no valid data format, return empty array
  console.warn("Unexpected locations data format:", data);
  return [];
}

async function createLocation(
  city: string,
  address: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.post("/infrastructure/locations/", {
    city,
    address,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to create location",
    };
  }

  return {
    success: true,
    message: "Location created successfully",
  };
}

export default function LocationsPage() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const city = formData.get("city") as string;
    const address = formData.get("address") as string;

    try {
      const result = await createLocation(city, address);

      if (result.success) {
        toast.success(result.message || "Location created successfully!");
        // Refresh locations list after successful addition
        const locationList = await listLocations();
        setLocations(Array.isArray(locationList) ? locationList : []);
        // Reset form
        e.currentTarget.reset();
        setShowAddForm(false);
      } else {
        toast.error(result.error || "Failed to create location");
      }
    } catch (error) {
      console.error("Failed to add location:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchLocations() {
      try {
        const locationList = await listLocations();
        console.log("Fetched locations:", locationList);
        setLocations(Array.isArray(locationList) ? locationList : []);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        // Silently fail - data will show when available
        setLocations([]);
      }
    }

    // Fetch in background - don't block rendering
    fetchLocations();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
          <SettingsSidebar />

          {/* Main content */}
          <div className="flex-1 p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Locations" />
              <SettingsNavTabs />

              {/* Content area */}
              <div className="flex gap-8">
                {/* Content */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {/* Add Location Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 text-sm"
                      >
                        {showAddForm ? "Cancel" : "Add Location"}
                      </button>
                    </div>

                    {/* Add Location Form */}
                    {showAddForm && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">
                          Add New Location
                        </h2>
                        <AddLocationForm
                          handleAddLocation={handleAddLocation}
                          submitting={submitting}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      {/* Map placeholder */}
                      <LocationMap />

                      {/* Locations list */}
                      <div className="space-y-4">
                        {locations.length > 0 ? (
                          locations.map((loc) => (
                            <div
                              key={loc.id}
                              className="bg-card border border-border rounded-lg p-4 hover:shadow-sm"
                            >
                              <h3 className="font-semibold text-sm mb-1">
                                {loc.city}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-3">
                                {loc.address}
                              </p>
                              <div className="flex gap-6 text-xs">
                                <span className="text-muted-foreground">
                                  {loc.circuit_count || 0} circuits
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-card border border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                            No locations found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

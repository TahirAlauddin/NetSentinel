"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SettingsNavTabs } from "@/components/settings/settings-nav-tabs";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import AddLocationForm from "@/components/locations/add-location-form";
import { LocationRecord } from "@/types/locations";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import LocationMap from "@/components/locations/location-map";

export default function LocationsPage() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const infrastructureApiClient = useMemo(() => new InfrastructureApiClient(), []);

  const handleAddLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await infrastructureApiClient.createLocation({
        name: formData.get("name") as string,
        alias: formData.get("alias") as string,
        address1: formData.get("address1") as string,
        address2: formData.get("address2") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        zip_code: formData.get("zip_code") as string,
        phone: formData.get("phone") as string,
        longitude: parseFloat(formData.get("longitude") as string),
        latitude: parseFloat(formData.get("latitude") as string),
        type_building: formData.get("type_building") as string,
        mpoe: formData.get("mpoe") as string,
        dmarc: formData.get("dmarc") as string,
      });

      if (result.data && typeof result.data === "object" && result.data !== null && "id" in result.data) {
        toast.success("Location created successfully!");
        setLocations((prev) => [...prev, result.data as LocationRecord]);
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
        const response = await infrastructureApiClient.getLocations<LocationRecord[] | { results: LocationRecord[] }>();
        const locationRawData: LocationRecord[] | { results: LocationRecord[] } | undefined = response.data;
        
        // Helper to extract data from either array or paginated response
        const extractResults = <T,>(data: T[] | { results: T[] } | undefined): T[] => {
          if (!data) return [];
          return Array.isArray(data) ? data : (data as { results: T[] }).results || [];
        };
        
        const locationList = extractResults(locationRawData);
        setLocations(locationList);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        // Silently fail - data will show when available
        setLocations([]);
      }
    }

    // Fetch in background - don't block rendering
    fetchLocations();
  }, [session, infrastructureApiClient]);

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
                        <h2 className="text-sm font-medium mb-4">Add New Location</h2>
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
                              <h3 className="font-semibold text-sm mb-1">{loc.city}</h3>
                              <p className="text-xs text-muted-foreground mb-3">{loc.address1}</p>
                              <div className="flex gap-6 text-xs">
                                <span className="text-muted-foreground">{0} circuits</span>
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

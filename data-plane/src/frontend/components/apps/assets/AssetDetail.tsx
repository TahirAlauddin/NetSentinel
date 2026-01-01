"use client";

import { useState, useEffect } from "react";
import { AssetsApiClient } from "@/lib/api-client/asset";
import { Asset } from "@/types/assets";
import { STATUS_OPTIONS } from "@/constants/assets";
import {
  SetTeammateDialog,
  SetLocationDialog,
  SoftwareDialog,
  CostDepreciationDialog,
  CustomDetailsDialog,
  NotesDialog,
  AlertsDialog,
} from "@/components/apps/assets/pages/detail/dialogs";
import { AssetDetailHeader } from "./pages/detail/AssetDetailHeader";
import { AssetDetailContent } from "./pages/detail/AssetDetailContent";

interface AssetDetailProps {
  assetId: number;
  onUpdate?: (asset: Asset) => void;
}

export function AssetDetail({ assetId, onUpdate }: AssetDetailProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("usage-status");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dialog states
  const [teammateDialogOpen, setTeammateDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [softwareDialogOpen, setSoftwareDialogOpen] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [customDetailsDialogOpen, setCustomDetailsDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);

  // Local state for sections
  const [software, setSoftware] = useState<
    Array<{ name: string; version: string; licenseType: string }>
  >([]);
  const [customDetails, setCustomDetails] = useState<Array<{ key: string; value: string }>>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Array<{ type: string; message: string }>>([]);
  const [teammate, setTeammate] = useState<{ userId: string; userName: string } | null>(null);
  const [location, setLocation] = useState<{ locationId: string; locationName: string } | null>(
    null
  );

  // Fetch asset data
  useEffect(() => {
    const loadAsset = async () => {
      try {
        setLoading(true);
        const assetsApiClient = new AssetsApiClient();
        const response = await assetsApiClient.getAsset<Asset>(assetId);

        if (response.error) {
          console.error("Error loading asset:", response.error);
          setLoading(false);
          return;
        }

        if (response.data) {
          setAsset(response.data);
          // TODO: Map asset.managed_by to teammate if needed
          // TODO: Map asset.location to location if needed
        }
      } catch (err) {
        console.error("Error loading asset:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [assetId]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileSidebarOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading || !asset) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading asset data...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === asset.status) || STATUS_OPTIONS[0];

  const handleStatusChange = (newStatus: string) => {
    const updatedAsset = { ...asset, status: newStatus as Asset["status"] };
    setAsset(updatedAsset);
    onUpdate?.(updatedAsset);
  };

  return (
    <div className="flex flex-col bg-gray-50 h-[80vh] sticky top-16 overflow-hidden">
      <AssetDetailHeader
        asset={asset}
        currentStatus={currentStatus}
        onStatusChange={handleStatusChange}
      />

      <AssetDetailContent
        asset={asset}
        currentStatus={currentStatus}
        activeSection={activeSection}
        mobileSidebarOpen={mobileSidebarOpen}
        teammate={teammate}
        location={location}
        software={software}
        customDetails={customDetails}
        notes={notes}
        alerts={alerts}
        scrollToSection={scrollToSection}
        setMobileSidebarOpen={setMobileSidebarOpen}
        setTeammateDialogOpen={setTeammateDialogOpen}
        setLocationDialogOpen={setLocationDialogOpen}
        setSoftwareDialogOpen={setSoftwareDialogOpen}
        setCostDialogOpen={setCostDialogOpen}
        setCustomDetailsDialogOpen={setCustomDetailsDialogOpen}
        setNotesDialogOpen={setNotesDialogOpen}
        setAlertsDialogOpen={setAlertsDialogOpen}
        onStatusChange={handleStatusChange}
      />

      {/* Dialogs */}
      <SetTeammateDialog
        open={teammateDialogOpen}
        onOpenChange={setTeammateDialogOpen}
        onSave={setTeammate}
      />
      <SetLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        onSave={setLocation}
      />
      <SoftwareDialog
        open={softwareDialogOpen}
        onOpenChange={setSoftwareDialogOpen}
        onSave={(data) => setSoftware([...software, data])}
      />
      <CostDepreciationDialog
        open={costDialogOpen}
        onOpenChange={setCostDialogOpen}
        onSave={(data) => {
          // TODO: Update asset with cost depreciation data
          // This needs to be mapped to the correct Asset fields
          const updatedAsset = { ...asset };
          setAsset(updatedAsset);
        }}
        currentValues={{
          purchasePrice:
            (asset as any).costDepreciation?.purchasePrice || asset.purchase_price || undefined,
          replacementCost:
            (asset as any).costDepreciation?.replacementCost || asset.replacement_cost || undefined,
          salvageValue:
            (asset as any).costDepreciation?.salvageValue || asset.salvage_value || undefined,
          usefulLife:
            (asset as any).costDepreciation?.usefulLife || asset.useful_life_years || undefined,
          approachingEndOfLife:
            (asset as any).costDepreciation?.approachingEndOfLife ||
            asset.approaching_eol_months ||
            undefined,
          poNumber: (asset as any).costDepreciation?.poNumber || asset.po_number || undefined,
        }}
      />
      <CustomDetailsDialog
        open={customDetailsDialogOpen}
        onOpenChange={setCustomDetailsDialogOpen}
        onSave={(data) => setCustomDetails([...customDetails, data])}
      />
      <NotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        onSave={(note) => setNotes([...notes, note])}
      />
      <AlertsDialog
        open={alertsDialogOpen}
        onOpenChange={setAlertsDialogOpen}
        onSave={(data) => setAlerts([...alerts, data])}
      />
    </div>
  );
}

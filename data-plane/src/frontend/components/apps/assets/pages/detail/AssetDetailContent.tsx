import React from "react";
import {
  AssetDetailSidebar,
  UsageStatusSection,
  SystemDetailsSection,
  SoftwareSection,
  CostDepreciationSection,
  WarrantyAcquisitionSection,
  RelatedItemsSection,
  CustomDetailsSection,
  NotesSection,
  AlertsSection,
  SourcesSection,
  HistorySection,
  AutomationHistorySection,
} from "./index";
import { Asset } from "@/types/assets";
import { STATUS_OPTIONS } from "@/constants/assets";

interface AssetDetailContentProps {
  asset: Asset;
  currentStatus: (typeof STATUS_OPTIONS)[0];
  activeSection: string;
  mobileSidebarOpen: boolean;
  teammate: { userId: string; userName: string } | null;
  location: { locationId: string; locationName: string } | null;
  software: Array<{ name: string; version: string; licenseType: string }>;
  customDetails: Array<{ key: string; value: string }>;
  notes: string[];
  alerts: Array<{ type: string; message: string }>;
  scrollToSection: (id: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTeammateDialogOpen: (open: boolean) => void;
  setLocationDialogOpen: (open: boolean) => void;
  setSoftwareDialogOpen: (open: boolean) => void;
  setCostDialogOpen: (open: boolean) => void;
  setCustomDetailsDialogOpen: (open: boolean) => void;
  setNotesDialogOpen: (open: boolean) => void;
  setAlertsDialogOpen: (open: boolean) => void;
  onStatusChange: (newStatus: string) => void;
}

/**
 * AssetDetailContent component - Displays the main content area with sidebar and scrollable sections
 */
export function AssetDetailContent({
  asset,
  currentStatus,
  activeSection,
  mobileSidebarOpen,
  teammate,
  location,
  software,
  customDetails,
  notes,
  alerts,
  scrollToSection,
  setMobileSidebarOpen,
  setTeammateDialogOpen,
  setLocationDialogOpen,
  setSoftwareDialogOpen,
  setCostDialogOpen,
  setCustomDetailsDialogOpen,
  setNotesDialogOpen,
  setAlertsDialogOpen,
  onStatusChange,
}: AssetDetailContentProps) {

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <AssetDetailSidebar
        activeSection={activeSection}
        mobileSidebarOpen={mobileSidebarOpen}
        onSectionClick={scrollToSection}
        onMobileSidebarToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onMobileSidebarClose={() => setMobileSidebarOpen(false)}
      />

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <UsageStatusSection
            asset={asset}
            currentStatus={currentStatus}
            onStatusChange={onStatusChange}
            teammate={teammate}
            location={location}
            onTeammateClick={() => setTeammateDialogOpen(true)}
            onLocationClick={() => setLocationDialogOpen(true)}
          />

          <SystemDetailsSection asset={asset} />

          <SoftwareSection software={software} onAddSoftware={() => setSoftwareDialogOpen(true)} />

          <CostDepreciationSection asset={asset} onEdit={() => setCostDialogOpen(true)} />

          <WarrantyAcquisitionSection />

          <RelatedItemsSection />

          <CustomDetailsSection
            customDetails={customDetails}
            onAdd={() => setCustomDetailsDialogOpen(true)}
          />

          <NotesSection notes={notes} onAdd={() => setNotesDialogOpen(true)} />

          <AlertsSection alerts={alerts} onAdd={() => setAlertsDialogOpen(true)} />

          <SourcesSection asset={asset} />

          <HistorySection asset={asset} />

          <AutomationHistorySection />
        </div>
      </main>
    </div>
  );
}

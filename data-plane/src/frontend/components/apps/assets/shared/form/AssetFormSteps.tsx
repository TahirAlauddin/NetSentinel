"use client";

import { BasicDetailsStep } from "../steps/BasicDetailsStep";
import { TechSpecsStep } from "../steps/TechSpecsStep";
import { LocationAndUsageStep } from "../steps/LocationAndUsageStep";
import { CostDepreciationStep } from "../steps/CostDepreciationStep";
import { WarrantyAcquisitionStep } from "../steps/WarrantyAcquisitionStep";
import { AlertsStep } from "../steps/AlertsStep";
import { AdditionalDetailsStep } from "../steps/AdditionalDetailsStep";
import { useAssetForm } from "./AssetFormContext";

/**
 * AssetFormSteps component
 * The Asset Form component that renders the appropriate step in the main card content based on current step index
 * i.e. Basic Details, Tech Specs, Location & Usage, Cost Depreciation, Warranty & Acquisition, Alerts, Additional Details.
 * All steps use the AssetFormContext to access formData and updateField.
 *
 * @returns The appropriate step component
 */
export const AssetFormSteps = () => {
  const { currentStep } = useAssetForm();
  switch (currentStep) {
    case 0:
      return <BasicDetailsStep />;
    case 1:
      return <TechSpecsStep />;
    case 2:
      return <LocationAndUsageStep />;
    case 3:
      return <CostDepreciationStep />;
    case 4:
      return <WarrantyAcquisitionStep />;
    case 5:
      return <AlertsStep />;
    case 6:
      return <AdditionalDetailsStep />;
    default:
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Step {currentStep + 1}</h2>
          <p className="text-gray-600">Additional fields for this section coming soon...</p>
        </div>
      );
  }
};

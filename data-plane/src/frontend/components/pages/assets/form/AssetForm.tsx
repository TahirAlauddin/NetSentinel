"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { STEPS } from "@/constants/assets";
import { Asset, CustomLifecycle } from "@/types/assets";

import { AssetFormStepsProgress } from "./AssetFormStepsProgress";
import ActionsBar from "./AssetFormActionsBar";
import AssetFormHeader from "./AssetFormHeader";
import AssetFormTip from "./AssetFormTip";
import AssetFormSteps from "./AssetFormSteps";
import { AssetFormProvider } from "./AssetFormContext";
import { useFormActions } from "../hooks/useFormActions";
import { LocationRecord } from "@/types/locations";
import { UserRecord } from "@/types/users";
import { DepartmentRecord } from "@/types/departments";
import { Category } from "@/types/assets";

import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { AssetsApiClient } from "@/lib/api-client/asset";
import { UserApiClient } from "@/lib/api-client/user";


/**
 * AssetForm - Multi-step form for creating/editing assets
 *
 */
export function AssetForm({assetId}: {assetId?: number | null}) {
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [customLifecycles, setCustomLifecycles] = useState<CustomLifecycle[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]); 
  const infrastructureApiClient = new InfrastructureApiClient();
  const assetsApiClient = new AssetsApiClient();
  const userApiClient = new UserApiClient();

  useEffect(() => {
    // Fetch all data needed for the form
    const fetchData = async () => {
      const [locations, departments, categories, customLifecycles, users] = await Promise.all([
        infrastructureApiClient.getLocations(),
        infrastructureApiClient.getDepartments(),
        assetsApiClient.getAssetCategories(),
        assetsApiClient.getLifecycles(),
        userApiClient.getUsers(),
      ]);
      setLocations(locations.data);
      setDepartments(departments.data);
      setCategories(categories.data);
      setCustomLifecycles(customLifecycles.data);
      setUsers(users.data);
      setLoading(false);

      if (assetId) {
        // Fetch the asset data if an asset ID is provided 
        // Populate the form data with the asset data in detail page
        const asset = await assetsApiClient.getAsset(assetId);
        if (asset.data) {
          setFormData(asset.data);
        }
      }
    };
    fetchData();
  }, []); 

  // Get form actions from hook (manages currentStep state)
  // Pass formData as parameter to avoid context dependency
  const {
    currentStep,
    handleNext,
    handlePrevious,
    handleSave,
    handleStepClick,
    isSubmitting,
    fieldErrors,
    clearFieldError,
  } = useFormActions(assetId?.toString() || null, formData);

  // Enhanced handleInputChange that clears field errors when field changes
  const handleInputChangeWithErrorClear = useCallback(
    (field: string, value: any) => {
      // Clear error for this field when user starts typing
      clearFieldError(field);
      // Update the field value
      setFormData({ ...formData, [field]: value });
    },
    [clearFieldError, formData]
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <AssetFormHeader />

        <AssetFormProvider
          formData={formData}
          onInputChange={handleInputChangeWithErrorClear}
          currentStep={currentStep}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          handleSave={handleSave}
          handleStepClick={handleStepClick}
          isSubmitting={isSubmitting}
          fieldErrors={fieldErrors}
        >
          {/* Main Layout: Steps on Left, Form in Middle, Tips on Right */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 h-[60vh]">
            {/* Steps Progress - Left Sidebar (Desktop only, mobile shows above) */}
            <div className="hidden md:block w-full lg:w-64 xl:w-72 flex-shrink-0">
              <AssetFormStepsProgress steps={STEPS} />
            </div>

            {/* Main Content - Form */}
            <div className="flex-1 min-w-0 h-full">
              {/* Mobile/Tablet: Progress bar (shown above form) */}
              <div className="md:hidden mb-4">
                <AssetFormStepsProgress steps={STEPS} />
              </div>
              <Card className="p-4 sm:p-6 lg:p-8 h-full justify-between">
                {/* AssetFormSteps uses context, no props needed */}
                <AssetFormSteps />

                {/* Actions bar */}
                <ActionsBar isSubmitting={isSubmitting} />
              </Card>
            </div>

            {/* Right Sidebar - Tips (Hidden on small screens, shown on xl screens) */}
            <AssetFormTip />
          </div>
        </AssetFormProvider>
      </div>
    </div>
  );
}

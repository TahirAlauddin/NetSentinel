"use client";

import { useCallback, useEffect, useState, useMemo } from "react";

import { Card } from "@/components/ui/card";
import { STEPS } from "@/constants/assets";
import { Asset, CustomLifecycle } from "@/types/assets";

import { AssetFormStepsProgress } from "./AssetFormStepsProgress";
import ActionsBar from "./AssetFormActionsBar";
import AssetFormHeader from "./AssetFormHeader";
import AssetFormTip from "./AssetFormTip";
import AssetFormSteps from "./AssetFormSteps";
import { AssetFormProvider } from "./AssetFormContext";
import { useFormActions } from "../../hooks/useFormActions";
import { LocationRecord } from "@/types/locations";
import { UserRecord } from "@/types/users";
import { DepartmentRecord } from "@/types/departments";
import { Category } from "@/types/assets";
import { LoadingState } from "@/components/feedback/loading-state";

import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { AssetsApiClient } from "@/lib/api-client/asset";
import { UserApiClient } from "@/lib/api-client/user";

interface AssetFormProps {
  assetId?: number | null;
  mode?: "create" | "edit";
}

/**
 * AssetForm - Multi-step form for creating/editing assets
 *
 * @param assetId - The asset ID if editing, null if creating
 * @param mode - The form mode: "create" for new assets, "edit" for editing existing assets
 */
export function AssetForm({ assetId, mode }: AssetFormProps) {
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [customLifecycles, setCustomLifecycles] = useState<CustomLifecycle[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedItems, setRelatedItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize API clients once using useMemo
  const apiClients = useMemo(
    () => ({
      infrastructure: new InfrastructureApiClient(),
      assets: new AssetsApiClient(),
      user: new UserApiClient(),
    }),
    []
  );

  // Determine form mode: explicit mode prop takes precedence, otherwise infer from assetId
  const formMode: "create" | "edit" = useMemo(() => {
    return mode || (assetId ? "edit" : "create");
  }, [mode, assetId]);

  // Fetch all required data for the form
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch reference data (locations, departments, categories, etc.)
        const [locationsRes, departmentsRes, categoriesRes, customLifecyclesRes, usersRes] =
          await Promise.all([
            apiClients.infrastructure.getLocations(),
            apiClients.infrastructure.getDepartments(),
            apiClients.assets.getAssetCategories(),
            apiClients.assets.getLifecycles(),
            apiClients.assets.getAssetRelation(assetId || ""),
            apiClients.user.getUsers(),
          ]);

        setLocations(locationsRes.data?.results || []);
        setDepartments(departmentsRes.data?.results || []);
        setCategories(categoriesRes.data?.results || []);
        setCustomLifecycles(customLifecyclesRes.data?.results || []);
        setUsers(usersRes.data?.results || []);

        // If editing, fetch the asset data
        if (assetId && formMode === "edit") {
          try {
            const assetRes = await apiClients.assets.getAsset(assetId);
            if (assetRes.data) {
              setFormData(assetRes.data);
            } else {
              setError("Asset not found");
            }
          } catch (assetError) {
            const errorMessage =
              assetError instanceof Error ? assetError.message : "Failed to load asset";
            setError(errorMessage);
            console.error("Error loading asset:", assetError);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load form data";
        setError(errorMessage);
        console.error("Error loading form data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assetId, formMode, apiClients]);

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
  } = useFormActions(assetId?.toString() || null, formData, formMode);

  // Enhanced handleInputChange that clears field errors when field changes
  const handleInputChangeWithErrorClear = useCallback(
    (field: string, value: any) => {
      // Clear error for this field when user starts typing
      clearFieldError(field);
      // Update the field value using functional form to avoid stale closure
      setFormData((prevFormData) => ({ ...prevFormData, [field]: value }));
    },
    [clearFieldError]
  );

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <LoadingState
            message={
              formMode === "edit"
                ? "Loading asset data..."
                : "Loading form data..."
            }
          />
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (error) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            <h3 className="font-semibold mb-2">Error loading form</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
          locations={locations}
          departments={departments}
          categories={categories}
          relatedItems={relatedItems}
          customLifecycles={customLifecycles}
          users={users}
          mode={formMode}
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

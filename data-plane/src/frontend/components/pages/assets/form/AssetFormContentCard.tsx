import { Card } from "@/components/ui/card";
import React from "react";
import AssetFormSteps from "./AssetFormSteps";
import ActionsBar from "./AssetFormActionsBar";
import { AssetFormData, CustomLifecycle } from "@/types/assets";
import { LocationRecord } from "@/types/locations";
import { UserRecord } from "@/types/users";
import { DepartmentRecord } from "@/types/departments";

/**
 * Props for the AssetFormContentCard component
 */
interface AssetFormContentCardProps {
  loadingData: boolean;
  currentStep: number;
  formData: AssetFormData;
  handleInputChange: (field: string, value: any) => void;
  users: UserRecord[];
  locations: LocationRecord[];
  departments: DepartmentRecord[];
  customLifecycles: CustomLifecycle[];
  isSubmitting: boolean;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSave: () => void;
}

/**
 * AssetFormContentCard component
 * The actual card which shows the actual form, with labels, input boxes, dropdowns, etc. including the actions bar at the bottom.
 * @param loadingData - Whether the data is currently being loaded
 * @param currentStep - The current step of the form
 * @param formData - The form data
 * @param handleInputChange - The function to handle the input change
 * @param users - The users
 * @param locations - The locations
 * @param departments - The departments
 * @param customLifecycles - The custom lifecycles
 * @param isSubmitting - Whether the form is currently being submitted
 * @param handleNext - The function to handle the next step
 * @param handlePrevious - The function to handle the previous step
 * @param handleSave - The function to handle the save action
 * @returns
 */
const AssetFormContentCard = ({
  loadingData,
  currentStep,
  formData,
  handleInputChange,
  users,
  locations,
  departments,
  customLifecycles,
  isSubmitting,
  handleNext,
  handlePrevious,
  handleSave,
}: AssetFormContentCardProps) => {
  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      {loadingData ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading form data...</div>
        </div>
      ) : (
        <AssetFormSteps
          currentStep={currentStep}
          formData={formData}
          onInputChange={handleInputChange}
          users={users}
          locations={locations}
          departments={departments}
          customLifecycles={customLifecycles}
        />
      )}

      {/* Actions bar */}
      <ActionsBar
        currentStep={currentStep}
        isSubmitting={isSubmitting}
        handleNext={handleNext}
        handlePrevious={handlePrevious}
        handleSave={handleSave}
        formData={formData}
      />
    </Card>
  );
};

export default AssetFormContentCard;

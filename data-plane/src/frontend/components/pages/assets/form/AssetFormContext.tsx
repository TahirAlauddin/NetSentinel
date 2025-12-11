"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { Asset, Category, CustomLifecycle } from "@/types/assets";
import { DepartmentRecord } from "@/types/departments";
import { UserRecord } from "@/types/users";
import { LocationRecord } from "@/types/locations";

/**
 * AssetFormProviderProps - Props for the AssetFormProvider component
 */
interface AssetFormProviderProps {
  children: ReactNode;
  formData: Partial<Asset>;
  locations: LocationRecord[];
  departments: DepartmentRecord[];
  categories: Category[];
  customLifecycles: CustomLifecycle[];
  users: UserRecord[];
  currentStep: number;
  isSubmitting: boolean;
  fieldErrors?: Record<string, string>;
  mode: "create" | "edit";
  relatedItems: Asset[]; // TODO: We'll need to allow asset relations with every entity
  onInputChange: (field: string, value: any) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSave: () => Promise<void>;
  handleStepClick: (stepIndex: number) => void;
}

/**
 * AssetFormContextValue - The type of the asset form context value
 */
interface AssetFormContextValue {
  formData: Partial<Asset>;
  currentStep: number;
  isSubmitting: boolean;
  fieldErrors?: Record<string, string>;
  mode: "create" | "edit";
  locations: LocationRecord[];
  departments: DepartmentRecord[];
  categories: Category[];
  customLifecycles: CustomLifecycle[];
  users: UserRecord[];
  relatedItems: Asset[]; // TODO: We'll need to allow asset relations with every entity
  updateField: (field: string, value: any) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSave: () => Promise<void>;
  handleStepClick: (stepIndex: number) => void;
}

export const AssetFormContext = createContext<AssetFormContextValue | undefined>(undefined);

/**
 * AssetFormProvider - Provides the asset form context to the children
 * This is used to provide the form data, navigation handlers, and step state to the children.
 *
 * @param children - The children to render
 * @param formData - The form data
 * @param locations - The locations
 * @param departments - The departments
 * @param categories - The categories
 * @param customLifecycles - The custom lifecycles
 * @param users - The users
 * @param relatedItems - The related items
* @param onInputChange - The function to update the form data
 * @param currentStep - The current step index
 * @param handleNext - Handler for moving to next step
 * @param handlePrevious - Handler for moving to previous step
 * @param handleSave - Handler for saving the form
 * @param handleStepClick - Handler for clicking on a step
 * @param isSubmitting - Whether the form is currently submitting
 */
export function AssetFormProvider({
  children,
  formData,
  locations,
  departments,
  categories,
  customLifecycles,
  users,
  relatedItems,
  onInputChange,
  currentStep,
  handleNext,
  handlePrevious,
  handleSave,
  handleStepClick,
  isSubmitting,
  fieldErrors,
  mode,
}: AssetFormProviderProps) {
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      formData,
      currentStep,
      updateField: onInputChange,
      handleNext,
      handlePrevious,
      handleSave,
      handleStepClick,
      isSubmitting,
      fieldErrors: fieldErrors || {},
      mode,
      locations,
      departments,
      categories,
      customLifecycles,
      users,
      relatedItems,
    }),
    [
      formData,
      onInputChange,
      currentStep,
      handleNext,
      handlePrevious,
      handleSave,
      handleStepClick,
      isSubmitting,
      fieldErrors,
      mode,
      locations,
      departments,
      categories,
      customLifecycles,
      users,
      relatedItems,
    ]
  );

  return <AssetFormContext.Provider value={value}>{children}</AssetFormContext.Provider>;
}

/**
 * useAssetForm - Hook to use the asset form context
 * This is used to get the form data, navigation handlers, and step state.
 *
 * @returns The asset form context value
 */
export function useAssetForm() {
  const context = useContext(AssetFormContext);
  if (!context) {
    throw new Error("useAssetForm must be used within AssetFormProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { Asset } from "@/types/assets";

/**
 * AssetFormProviderProps - Props for the AssetFormProvider component
 */
interface AssetFormProviderProps {
  children: ReactNode;
  formData: Partial<Asset>;
  currentStep: number;
  isSubmitting: boolean;
  fieldErrors?: Record<string, string>;
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
  onInputChange,
  currentStep,
  handleNext,
  handlePrevious,
  handleSave,
  handleStepClick,
  isSubmitting,
  fieldErrors,
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

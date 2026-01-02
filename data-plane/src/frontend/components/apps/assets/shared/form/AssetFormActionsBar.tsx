"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { STEPS } from "@/constants/assets";
import { validateStepForCreate, validateStepForUpdate } from "../../utils";
import { useAssetForm } from "./AssetFormContext";

interface ActionsBarProps {
  isSubmitting?: boolean;
}

/**
 * ActionsBar component
 * The actions bar at the bottom of the form, including the cancel button, the previous button, the next button, and the save button.
 * Uses context for formData, currentStep, and handlers.
 * @param isSubmitting - Whether the form is currently being submitted (optional, falls back to context)
 * @returns
 */
export const ActionsBar = ({ isSubmitting: externalIsSubmitting }: ActionsBarProps) => {
  const {
    formData,
    currentStep,
    handleNext,
    handlePrevious,
    handleSave,
    isSubmitting: contextIsSubmitting,
    fieldErrors,
    mode,
  } = useAssetForm();
  const router = useRouter();
  // Use external isSubmitting if provided, otherwise use context
  const isSubmitting = externalIsSubmitting ?? contextIsSubmitting;
  
  // Validate directly from formData without transforming (transformation only happens on submit)
  // This prevents errors from being thrown when just checking button state
  // The validation functions accept Partial<Asset> and handle missing fields gracefully
  const isValid = useMemo(() => {
    if (mode === "create") {
      return validateStepForCreate(currentStep, formData).isValid;
    } else {
      return validateStepForUpdate(currentStep, formData).isValid;
    }
  }, [currentStep, formData, mode]);
  
  // Check if current step has validation errors
  const hasErrors = fieldErrors && Object.keys(fieldErrors).length > 0;
  return (
    <div className="flex flex-col sm:flex-row gap-3 border-t pt-4 sm:pt-6">
      <Button
        onClick={() => router.push("/assets")}
        className="flex-1 bg-transparent border border-gray-300 text-black hover:bg-gray-200"
        disabled={isSubmitting}
      >
        Cancel
      </Button>

      <Button
        onClick={handlePrevious}
        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
        disabled={isSubmitting || currentStep === 0}
      >
        Previous
      </Button>

      {currentStep === STEPS.length - 1 ? (
        <Button
          onClick={handleSave}
          disabled={!isValid || isSubmitting || hasErrors}
          className={`flex-1 ${
            isValid && !isSubmitting && !hasErrors
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-400 text-gray-600 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "Saving..." : "Save Asset"}
        </Button>
      ) : (
        <Button
          onClick={handleNext}
          disabled={hasErrors || !isValid}
          className={`flex-1 ${
            !hasErrors && isValid
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-400 text-gray-600 cursor-not-allowed"
          }`}
        >
          Next
        </Button>
      )}
    </div>
  );
};

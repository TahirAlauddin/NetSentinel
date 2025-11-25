import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { STEPS } from "@/constants/assets";
import { Asset } from "@/types/assets";
import { CalendarAlert } from "@/types/assets/fields";

import { validateStep } from "../utils";
import { updateAsset, createAsset } from "@/app/(app)/assets/actions";
import { toast } from "sonner";
import { transformToCreateDto, transformToUpdateDto } from "../utils/transform";
import { transformToCalendarAlertCreateUpdateDto } from "../utils/transform";
import { CalendarAlertApiClient } from "@/lib/api-client/calendar-alert";
/**
 * Hook for managing form navigation and submission actions
 *
 * @param assetId - The asset ID if editing, null if creating
 * @param formData - The current form data (passed as parameter to avoid context dependency)
 * @returns Object containing all action handlers and current step
 */
export function useFormActions(assetId: string | null, formData: Partial<Asset>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Use ref to always access latest formData in callbacks
  const formDataRef = useRef(formData);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Clear field errors when step changes
  useEffect(() => {
    setFieldErrors({});
  }, [currentStep]);

  /**
   * Handle moving to the next step
   * Validates current step before advancing
   */
  const handleNext = useCallback(() => {
    const latestFormData = formDataRef.current;
    const validation = validateStep(currentStep, latestFormData);

    if (!validation.isValid) {
      // Set field errors for display
      if (validation.fieldErrors) {
        setFieldErrors(validation.fieldErrors);
      }
      toast.error(validation.error || "Please fix the errors before proceeding");
      return;
    }

    // Clear errors and proceed
    setFieldErrors({});
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  /**
   * Handle moving to the previous step
   */
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Create calendar alerts for a newly created asset
   */
  const createCalendarAlertsForNewAsset = useCallback(
    async (newAssetId: number, alerts: CalendarAlert[]) => {
      const validAlerts = Array.isArray(alerts)
        ? alerts.filter(
            (alert) =>
              alert.date &&
              alert.message &&
              alert.date.trim() !== "" &&
              alert.message.trim() !== ""
          )
        : [];

      if (validAlerts.length === 0) {
        return;
      }

      const apiClient = new CalendarAlertApiClient();
      const results = await Promise.allSettled(
        validAlerts.map(async (alert) => {
          const transformedAlert = transformToCalendarAlertCreateUpdateDto(alert);
          return apiClient.createCalendarAlert(newAssetId, transformedAlert);
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled" && r.value.data).length;
      const failed = results.length - successful;

      if (failed > 0) {
        toast.error(`Failed to create ${failed} calendar alert(s)`);
      } else if (successful > 0) {
        toast.success(`Created ${successful} calendar alert(s)`);
      }
    },
    []
  );

  /**
   * Handle form submission
   * Validates current step before saving
   * For new assets, creates calendar alerts after asset creation
   */
  const handleSave = useCallback(async () => {
    const latestFormData = formDataRef.current;
    const validation = validateStep(currentStep, latestFormData);

    if (!validation.isValid) {
      toast.error(validation.error || "Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = assetId
        ? await updateAsset(parseInt(assetId, 10), transformToUpdateDto(latestFormData))
        : await createAsset(transformToCreateDto(latestFormData));

      if (result.success) {
        // If creating a new asset, create calendar alerts after asset creation
        if (!assetId && result.data?.id) {
          const calendarAlerts = Array.isArray(latestFormData.calendar_alerts)
            ? latestFormData.calendar_alerts
            : [];
          await createCalendarAlertsForNewAsset(result.data.id, calendarAlerts);
        }

        toast.success(
          result.message ||
            (assetId ? "Asset updated successfully!" : "Asset created successfully!")
        );
        router.push("/assets");
      } else {
        toast.error(result.error || "Failed to save asset");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save asset";
      toast.error(errorMessage);
      console.error("Error saving asset:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, assetId, router, createCalendarAlertsForNewAsset]);

  /**
   * Handle clicking on a step in the progress indicator
   * Only allows navigation to steps that have been visited
   */
  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex <= currentStep) {
        setCurrentStep(stepIndex);
      }
    },
    [currentStep, setCurrentStep]
  );

  /**
   * Clear error for a specific field
   * Handles field name variations (e.g., replacementCost vs replacement_cost)
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      // Try to delete the exact field name
      delete newErrors[fieldName];

      // Also try common variations (camelCase to snake_case and vice versa)
      // Convert camelCase to snake_case
      const snakeCase = fieldName.replace(/([A-Z])/g, "_$1").toLowerCase();
      delete newErrors[snakeCase];

      // Convert snake_case to camelCase
      const camelCase = fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      delete newErrors[camelCase];

      return newErrors;
    });
  }, []);

  return {
    handleNext,
    handlePrevious,
    handleSave,
    handleStepClick,
    currentStep,
    setCurrentStep,
    isSubmitting,
    fieldErrors,
    clearFieldError,
  };
}

"use client";

import { Input } from "@/components/ui/input";
import { FormField, TagField } from "../form";
import { useTechSpecsStep } from "../hooks/useFormDataFetch";
import { useAssetForm } from "../form/AssetFormContext";

/**
 * Tech Specs step component
 * Displays the tech specs step of the asset form
 * Uses the useTechSpecsStep hook to get the form data and onInputChange function
 * Uses the useAssetForm hook to get the field errors
 * Uses the TagField component to display the tags
 * @returns The tech specs step component
 */
export function TechSpecsStep() {
  const { formData, onInputChange } = useTechSpecsStep();
  const { fieldErrors } = useAssetForm();
  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Tech Specs</h2>

      <FormField label="MAC Addresses" optional error={fieldErrors?.mac_address}>
        <textarea
          value={formData.mac_address || ""}
          onChange={(e) => onInputChange("mac_address", e.target.value)}
          placeholder="Enter MAC addresses (e.g., 00:1B:44:11:3A:B7)"
          className={`w-full border rounded-lg px-3 py-2 text-sm min-h-24 ${
            fieldErrors?.mac_address ? "border-red-500" : "border-gray-300"
          }`}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="IP Address" optional error={fieldErrors?.ip_address}>
          <Input
            value={formData.ip_address || ""}
            onChange={(e) => onInputChange("ip_address", e.target.value)}
            placeholder="192.168.1.1"
            className={fieldErrors?.ip_address ? "border-red-500" : ""}
          />
        </FormField>

        <FormField label="Manufacturer" optional>
          <Input
            value={formData.manufacturer || ""}
            onChange={(e) => onInputChange("manufacturer", e.target.value)}
            placeholder="Manufacturer"
          />
        </FormField>
      </div>

      <FormField label="Model" optional>
        <Input
          value={formData.model || ""}
          onChange={(e) => onInputChange("model", e.target.value)}
          placeholder="Model"
        />
      </FormField>

      <TagField
        label="Tags"
        value={formData.tags || []}
        onChange={(tags) => onInputChange("tags", tags)}
        placeholder="Type a tag and press Enter"
        optional
      />
    </div>
  );
}

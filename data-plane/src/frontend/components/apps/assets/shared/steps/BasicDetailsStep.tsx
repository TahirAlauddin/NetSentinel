"use client";

import { Input } from "@/components/ui/input";

import { FormField, SelectField, VendorField } from "../form";

import { IMPACT_LEVELS } from "@/constants/assets";
import { useBasicDetailsStep } from "../../hooks/useFormDataFetch";
import { useAssetForm } from "../form/AssetFormContext";

/**
 * Basic Details step component
 */
export function BasicDetailsStep() {
  const { formData, onInputChange } = useBasicDetailsStep();
  const { fieldErrors, categories } = useAssetForm();

  // Extract category ID properly - handle object, number, or string
  // This ensures the SelectField displays the correct value even when category is an object
  const getCategoryValue = (category: any): string => {
    if (!category) return "";
    if (typeof category === "string") return category;
    if (typeof category === "number") return category.toString();
    if (typeof category === "object" && category !== null && "id" in category) {
      return category.id.toString();
    }
    return "";
  };

  // This is used to display the category name in the select field
  console.log("categories", categories);

  const categoryOptions = categories.map((category) => ({
    value: category.id.toString(),
    label: category.name,
  }));

  // This is used to get the category value from the form data
  const categoryValue = getCategoryValue(formData.category);

  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Basic Details</h2>

      <FormField label="Name" required error={fieldErrors?.name}>
        <Input
          value={formData.name || ""}
          onChange={(e) => onInputChange("name", e.target.value)}
          placeholder="Asset name"
          className={`w-full ${fieldErrors?.name ? "border-red-500" : ""}`}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          required
          label="Asset Type"
          options={categoryOptions}
          value={categoryValue}
          onChange={(value) => onInputChange("category", value)}
          placeholder={categories.length === 0 ? "Loading categories..." : "Select asset type"}
          error={fieldErrors?.category}
        />

        <FormField label="Asset Tag" optional>
          <Input
            value={formData.asset_tag || ""}
            onChange={(e) => onInputChange("asset_tag", e.target.value)}
            placeholder="Tag"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Impact" optional>
          <div className="flex gap-2">
            {Object.entries(IMPACT_LEVELS).map(([level, className]) => (
              <button
                key={level}
                type="button"
                onClick={() => onInputChange("impact", parseInt(level))}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium transition ${
                  formData.impact === parseInt(level)
                    ? className
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </FormField>
      </div>

      <VendorField
        label="Vendor"
        value={
          typeof formData.vendor === "number"
            ? formData.vendor
            : typeof formData.vendor === "object" && formData.vendor !== null && "id" in formData.vendor
            ? formData.vendor.id
            : null
        }
        onChange={(vendorId) => onInputChange("vendor", vendorId)}
        optional
        error={fieldErrors?.vendor}
      />

      <FormField label="Notes" optional>
        <textarea
          value={formData.notes || ""}
          onChange={(e) => onInputChange("notes", e.target.value)}
          placeholder="Add notes"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-24"
        />
      </FormField>
    </div>
  );
}

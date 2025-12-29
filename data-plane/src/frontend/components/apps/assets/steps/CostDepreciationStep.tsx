"use client";

import { ExternalLink, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormField, CurrencyField } from "../form";
import { Input } from "@/components/ui/input";
import { useFormLifecyclesFetch, useCostDepreciationStep } from "../hooks/useFormDataFetch";
import { useAssetForm } from "../form/AssetFormContext";

/**
 * Cost Depreciation step component
 */
export function CostDepreciationStep() {
  const router = useRouter();
  const { formData, onInputChange } = useCostDepreciationStep();
  const { customLifecycles, loading, error } = useFormLifecyclesFetch();
  const { fieldErrors } = useAssetForm();

  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Cost Depreciation</h2>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-900">
            Custom Lifecycle{" "}
            <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            Customize Lifecycles
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <div className="relative">
          <select
            value={formData.custom_lifecycle?.id?.toString() || ""}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId === "") {
                onInputChange("custom_lifecycle", null);
              } else {
                const selectedLifecycle = customLifecycles.find(
                  (lifecycle) => lifecycle.id.toString() === selectedId
                );
                if (selectedLifecycle) {
                  onInputChange("custom_lifecycle", selectedLifecycle);
                }
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none pr-10"
          >
            <option value="">Select a custom lifecycle</option>
            {loading ? (
              <option value="">Loading...</option>
            ) : error ? (
              <option value="">Error loading custom lifecycles</option>
            ) : (
              customLifecycles.map((lifecycle) => (
                <option key={lifecycle.id} value={lifecycle.id.toString()}>
                  {lifecycle.name}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CurrencyField
          label="Purchase Price"
          value={formData.purchase_price || "0"}
          onChange={(value) => onInputChange("purchase_price", value)}
          optional
          error={fieldErrors?.purchase_price}
        />
        <CurrencyField
          label="Replacement Cost"
          value={formData.replacement_cost || "0"}
          onChange={(value) => onInputChange("replacement_cost", value)}
          optional
          error={fieldErrors?.replacement_cost}
        />
        <CurrencyField
          label="Salvage Value"
          value={formData.salvage_value || "0"}
          onChange={(value) => onInputChange("salvage_value", value)}
          optional
          error={fieldErrors?.salvage_value}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Useful Life" optional error={fieldErrors?.useful_life_years}>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="1"
              min="0"
              value={formData.useful_life_years?.toString() || ""}
              onChange={(e) =>
                onInputChange("useful_life_years", e.target.value)
              }
              placeholder="0"
              className={`flex-1 border rounded-lg ${
                fieldErrors?.useful_life_years ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Years
            </span>
          </div>
        </FormField>

        <FormField label="Approaching End-of-Life" optional error={fieldErrors?.approaching_eol_months}>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="1"
              min="0"
              value={formData.approaching_eol_months?.toString() || ""}
              onChange={(e) =>
                onInputChange("approaching_eol_months", e.target.value)
              }
              placeholder="0"
              className={`flex-1 border rounded-lg ${
                fieldErrors?.approaching_eol_months ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Months
            </span>
          </div>
        </FormField>
      </div>

      <FormField label="PO#" optional>
        <Input
          value={formData.po_number || ""}
          onChange={(e) => onInputChange("po_number", e.target.value)}
          placeholder="Purchase order number"
          className="w-full border border-gray-300 rounded-lg"
        />
      </FormField>
    </div>
  );
}

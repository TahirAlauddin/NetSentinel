"use client"

import { DateField } from "../form"
import { useWarrantyAcquisitionStep } from "../../hooks/useFormDataFetch";
import { useAssetForm } from "../form/AssetFormContext";

/**
 * Warranty & Acquisition step component
 */
export function WarrantyAcquisitionStep() {
  const { formData, onInputChange } = useWarrantyAcquisitionStep();
  const { fieldErrors } = useAssetForm();
  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Warranty & Acquisition</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Machine Serial Number <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.machine_serial_number || ""}
            onChange={(e) => onInputChange("machine_serial_number", e.target.value)}
            placeholder="Serial number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Product Number <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.product_number || ""}
            onChange={(e) => onInputChange("product_number", e.target.value)}
            placeholder="Product number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DateField
          label="Acquisition Date"
          value={formData.acquisition_date || ""}
          onChange={(value) => onInputChange("acquisition_date", value)}
          optional
          error={fieldErrors?.acquisition_date}
        />
        <DateField
          label="Warranty Expiration"
          value={formData.warranty_expiration || ""}
          onChange={(value) => onInputChange("warranty_expiration", value)}
          optional
          error={fieldErrors?.warranty_expiration}
        />
        <DateField
          label="Installation Date"
          value={formData.installation_date || ""}
          onChange={(value) => onInputChange("installation_date", value)}
          optional
          error={fieldErrors?.installation_date}
        />
      </div>
    </div>
  )
}


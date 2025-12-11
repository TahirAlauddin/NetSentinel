"use client"

import { RelatedItemField } from "../form"
import { useAdditionalDetailsStep } from "../hooks/useFormDataFetch";
import { ImageUploadField } from "@/components/common/upload/ImageUploadField"
import { AttachmentsUploadField } from "@/components/common/upload/AttachmentsUploadField"

/**
 * Additional Details step component
 */
export function AdditionalDetailsStep() {
  const { formData, onInputChange } = useAdditionalDetailsStep();

  const attachments = Array.isArray(formData.attachments) ? formData.attachments : []
  const images = Array.isArray(formData.images) ? formData.images : []

  console.log("Related Items", formData.related_items);

  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Additional Details</h2>

      {/* Related Items */}
        <RelatedItemField
          label="Related Items"
          value={formData.related_items}
          onChange={(assets) => onInputChange("related_items", assets)}
          optional
          excludeAssetId={Number(formData.asset_id)} // Exclude current asset when editing
        />  

      <AttachmentsUploadField
        label="Attachments"
        value={attachments}
        onChange={(attachments) => onInputChange("attachments", attachments)}
        optional
        maxSizeMB={25}
      />

      <ImageUploadField
        label="Asset Image"
        value={images}
        onChange={(images) => onInputChange("images", images)}
        optional
        maxSizeMB={5}
        accept="image/png,image/jpeg,image/jpg"
        helperText="Recommend a 160x160 or larger square jpg or png."
      />

    </div>
  )
}


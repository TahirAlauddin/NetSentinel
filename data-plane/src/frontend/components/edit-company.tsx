"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsApiClient } from "@/lib/api-client/settings";
import { handleError } from "@/lib/error-handler";

interface EditCompanyProps {
  onCancel: () => void;
  onSaved?: (data: {
    companyName: string;
    subdomain: string;
    mainContact: string;
    phoneNumber: string;
  }) => void;
  initialData?: {
    companyName?: string;
    subdomain?: string;
    companyUrl?: string;
    mainContact?: string;
    phoneCountry?: string;
    phoneNumber?: string;
    phoneExtension?: string;
  };
}

export function EditCompany({ onCancel, onSaved, initialData }: EditCompanyProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || "NetSentinel Corp",
    subdomain: initialData?.subdomain || "netsentinel",
    companyUrl: initialData?.companyUrl || "https://netsentinel.com",
    mainContact: initialData?.mainContact || "admin@netsentinel.com",
    phoneCountry: initialData?.phoneCountry || "+1",
    phoneNumber: initialData?.phoneNumber || "",
    phoneExtension: initialData?.phoneExtension || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const response = await settingsApiClient.updateCompany({
        company_name: formData.companyName,
        subdomain: formData.subdomain,
        company_url: formData.companyUrl,
        main_contact: formData.mainContact,
        phone_country: formData.phoneCountry,
        phone_number: formData.phoneNumber,
        phone_extension: formData.phoneExtension,
      });
      if (response.error) {
        const appError = handleError(response);
        setSaveError(appError.userMessage);
        return;
      }
      const payload = response.data as
        | {
            company_name?: string;
            subdomain?: string;
            main_contact?: string;
            phone_number?: string;
          }
        | undefined;
      if (payload && onSaved) {
        onSaved({
          companyName: payload.company_name ?? formData.companyName,
          subdomain: payload.subdomain ?? formData.subdomain,
          mainContact: payload.main_contact ?? formData.mainContact,
          phoneNumber: payload.phone_number ?? formData.phoneNumber,
        });
      }
      onCancel();
    } catch (err) {
      const appError = handleError(err);
      setSaveError(appError.userMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-lg p-8 space-y-8 max-w-2xl"
    >
      {/* Basic Details Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Basic Details</h2>

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium mb-2">Company Name</label>
          <Input
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Enter company name"
          />
        </div>

        {/* Subdomain */}
        <div>
          <label htmlFor="subdomain" className="block text-sm font-medium mb-2">Subdomain</label>
          <Input
            id="subdomain"
            name="subdomain"
            value={formData.subdomain}
            onChange={handleChange}
            placeholder="e.g., mycompany"
          />
          <p className="text-xs text-blue-600 mt-1">https://{formData.subdomain}.netsentinel.app</p>
        </div>

        {/* Company URL */}
        <div>
          <label htmlFor="companyUrl" className="block text-sm font-medium mb-2">
            Company URL{" "}
            <span className="text-xs text-muted-foreground">(i.e. www.mycompanyurl.com)</span>
          </label>
          <Input
            id="companyUrl"
            name="companyUrl"
            value={formData.companyUrl}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>

        {/* Main Contact */}
        <div>
          <label htmlFor="mainContact" className="block text-sm font-medium mb-2">Main Contact</label>
          <Input
            id="mainContact"
            name="mainContact"
            type="email"
            value={formData.mainContact}
            onChange={handleChange}
            placeholder="contact@example.com"
          />
          <p className="text-xs text-muted-foreground mt-1">
            We&apos;ll notify this contact on major account changes.
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="block text-sm font-medium">Main Phone Number</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex">
                <select
                  name="phoneCountry"
                  value={formData.phoneCountry}
                  onChange={handleChange}
                  className="border border-border rounded-l-md px-3 py-2 text-sm bg-background"
                >
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+1">🇨🇦 +1</option>
                </select>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Phone number"
                  className="rounded-l-none border-l-0"
                />
              </div>
            </div>
            <div className="w-32">
              <Input
                name="phoneExtension"
                value={formData.phoneExtension}
                onChange={handleChange}
                placeholder="Ext."
              />
            </div>
          </div>
        </div>

      </div>

      {saveError && (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-8 border-t border-border">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

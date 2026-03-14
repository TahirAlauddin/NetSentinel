"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsApiClient } from "@/lib/api-client/settings";
import { handleError } from "@/lib/error-handler";

interface EditCompanyProps {
  onCancel: () => void;
  initialData?: {
    companyName?: string;
    subdomain?: string;
    companyUrl?: string;
    mainContact?: string;
    phoneCountry?: string;
    phoneNumber?: string;
    phoneExtension?: string;
    timeZone?: string;
    fiscalYearMonth?: string;
    fiscalYearDay?: string;
    isolateWorkspaces?: boolean;
    showFreeModules?: boolean;
    enableChatSupport?: boolean;
  };
}

export function EditCompany({ onCancel, initialData }: EditCompanyProps) {
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
    timeZone: initialData?.timeZone || "Eastern Time (US & Canada)",
    fiscalYearMonth: initialData?.fiscalYearMonth || "January",
    fiscalYearDay: initialData?.fiscalYearDay || "01",
    isolateWorkspaces: initialData?.isolateWorkspaces || false,
    showFreeModules: initialData?.showFreeModules ?? true,
    enableChatSupport: initialData?.enableChatSupport ?? true,
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
        time_zone: formData.timeZone,
        fiscal_year_month: formData.fiscalYearMonth,
        fiscal_year_day: formData.fiscalYearDay,
        isolate_workspaces: formData.isolateWorkspaces,
        show_free_modules: formData.showFreeModules,
        enable_chat_support: formData.enableChatSupport,
      });
      if (response.error) {
        const appError = handleError(response);
        setSaveError(appError.userMessage);
        return;
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
          <p className="text-xs text-blue-600 mt-1">https://{formData.subdomain}.gogenuity.com</p>
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

        {/* Time Zone */}
        <div>
          <label htmlFor="timeZone" className="block text-sm font-medium mb-2">Time Zone</label>
          <select
            id="timeZone"
            name="timeZone"
            value={formData.timeZone}
            onChange={handleChange}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option>Eastern Time (US & Canada)</option>
            <option>Central Time (US & Canada)</option>
            <option>Mountain Time (US & Canada)</option>
            <option>Pacific Time (US & Canada)</option>
          </select>
        </div>

        {/* Fiscal Year Start Date */}
        <div>
          <label htmlFor="fiscalYearMonth" className="block text-sm font-medium mb-2">Fiscal Year Start Date</label>
          <div className="flex gap-4">
            <select
              id="fiscalYearMonth"
              name="fiscalYearMonth"
              value={formData.fiscalYearMonth}
              onChange={handleChange}
              className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option>January</option>
              <option>February</option>
              <option>March</option>
              <option>April</option>
              <option>May</option>
              <option>June</option>
              <option>July</option>
              <option>August</option>
              <option>September</option>
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select>
            <select
              name="fiscalYearDay"
              value={formData.fiscalYearDay}
              onChange={handleChange}
              className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background"
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Toggles Section */}
      <div className="space-y-4 border-t border-border pt-8">
        {/* Isolate Workspaces */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Isolate Workspaces</label>
          <input
            type="checkbox"
            name="isolateWorkspaces"
            checked={formData.isolateWorkspaces}
            onChange={handleChange}
            className="w-5 h-5 rounded border-border"
          />
        </div>

        {/* Show Free Modules */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium block">Show free modules</label>
            <p className="text-xs text-muted-foreground">
              Free modules: Telecom, Network Monitoring, Marketplace
            </p>
          </div>
          <input
            type="checkbox"
            name="showFreeModules"
            checked={formData.showFreeModules}
            onChange={handleChange}
            className="w-5 h-5 rounded border-border"
          />
        </div>

        {/* Enable Chat Support */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable chat with Genuity support</label>
          <input
            type="checkbox"
            name="enableChatSupport"
            checked={formData.enableChatSupport}
            onChange={handleChange}
            className="w-5 h-5 rounded border-border"
          />
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

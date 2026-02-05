"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Shared input styles matching asset form: rounded-lg, smooth focus ring, transition
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const selectClass =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm appearance-none pr-10 transition-[color,box-shadow] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y min-h-24";
const labelClass = "block text-sm font-medium text-gray-900 mb-2";

const categories = [
  "Advertising",
  "Analytics",
  "Cloud",
  "Customer Support",
  "Developer Tools",
  "DevOps",
  "Facilities",
  "Finance and Accounting",
  "General",
  "HR",
  "Infrastructure",
  "IT and Security",
  "Marketing",
  "Onboarding/Offboarding",
  "Other",
  "Product and Design",
  "Productivity",
  "Sales and Business",
  "Telecom",
  "Uncategorized",
];

export default function NewContractPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<
    Array<{ name: string; email: string; phone: string }>
  >([{ name: "", email: "", phone: "" }]);

  const addContact = () => {
    setContacts([...contacts, { name: "", email: "", phone: "" }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/contracts/list");
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="text-base text-gray-500">
          <Link href="/contracts" className="text-blue-600 hover:underline">
            Contracts
          </Link>
          <span className="mx-2">&gt;</span>
          <span>New Contract</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Back Button */}
        <Link
          href="/contracts"
          className="inline-flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to overview
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl mb-4">Add New Contract</h1>
          <p className="text-base text-gray-600">
            Fill in the details below to create a new contract
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Basic Information</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className={labelClass}>
                  Contract Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Enter contract name"
                />
              </div>

              <div>
                <Label className={labelClass}>
                  Vendor <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Enter vendor name"
                />
              </div>

              <div>
                <Label className={labelClass}>
                  Category <span className="text-red-500">*</span>
                </Label>
                <select required className={selectClass}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className={labelClass}>Product/Service</Label>
                <Input
                  type="text"
                  className={inputClass}
                  placeholder="Enter product or service name"
                />
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Contract Terms</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className={labelClass}>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>
                  Contract Type <span className="text-red-500">*</span>
                </Label>
                <select required className={selectClass}>
                  <option value="">Select type</option>
                  <option value="fixed">Fixed term</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="perpetual">Perpetual</option>
                </select>
              </div>

              <div>
                <Label className={labelClass}>Renewal Notice Period</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    className={`flex-1 ${inputClass}`}
                    placeholder="60"
                  />
                  <select className={`min-w-[100px] ${selectClass}`}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className={labelClass}>Auto-Renewal</Label>
                <div className="flex items-center gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="autoRenewal"
                      value="yes"
                      className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="autoRenewal"
                      value="no"
                      className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                      defaultChecked
                    />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Financial Details</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className={labelClass}>
                  Total Contract Value <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    required
                    step="0.01"
                    className={`pl-7 ${inputClass}`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label className={labelClass}>Monthly Cost</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    className={`pl-7 ${inputClass}`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label className={labelClass}>Payment Frequency</Label>
                <select className={selectClass}>
                  <option value="">Select frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>

              <div>
                <Label className={labelClass}>Track Spending</Label>
                <div className="flex items-center gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trackSpending"
                      value="yes"
                      className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trackSpending"
                      value="no"
                      className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                      defaultChecked
                    />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>

              <div className="col-span-2">
                <Label className={labelClass}>Payment Terms</Label>
                <textarea
                  rows={3}
                  className={`${textareaClass} min-h-[80px]`}
                  placeholder="Enter payment terms and conditions"
                />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl">Contacts</h2>
              <button
                type="button"
                onClick={addContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            {contacts.map((contact, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
              >
                <div>
                  <Label className={labelClass}>
                    Name {index === 0 && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type="text"
                    required={index === 0}
                    className={inputClass}
                    placeholder="Contact name"
                  />
                </div>

                <div>
                  <Label className={labelClass}>
                    Email {index === 0 && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type="email"
                    required={index === 0}
                    className={inputClass}
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <Label className={labelClass}>Phone</Label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      className={`flex-1 ${inputClass}`}
                      placeholder="(555) 123-4567"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notifications & Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Notifications & Alerts</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 mt-1"
                  defaultChecked
                />
                <div>
                  <div className="text-base text-gray-900 font-medium">
                    Expiration Alerts
                  </div>
                  <div className="text-sm text-gray-600">
                    Send notifications before contract expires
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" className="w-5 h-5 mt-1" />
                <div>
                  <div className="text-base text-gray-900 font-medium">
                    Renewal Reminders
                  </div>
                  <div className="text-sm text-gray-600">
                    Get reminded during renewal notice period
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" className="w-5 h-5 mt-1" />
                <div>
                  <div className="text-base text-gray-900 font-medium">
                    Payment Due Alerts
                  </div>
                  <div className="text-sm text-gray-600">
                    Notify when payments are due
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" className="w-5 h-5 mt-1" />
                <div>
                  <div className="text-base text-gray-900 font-medium">
                    Budget Threshold Alerts
                  </div>
                  <div className="text-sm text-gray-600">
                    Alert when spending exceeds threshold
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Documents</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-base text-gray-700 mb-2">
                <label className="text-blue-600 cursor-pointer hover:underline">
                  Click to upload
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx"
                  />
                </label>{" "}
                or drag and drop
              </div>
              <div className="text-sm text-gray-500">
                PDF, DOC, DOCX up to 10MB
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Additional Information</h2>

            <div className="space-y-6">
              <div>
                <Label className={labelClass}>Tags</Label>
                <Input
                  type="text"
                  className={inputClass}
                  placeholder="Add tags separated by commas"
                />
                <div className="text-sm text-gray-500 mt-2">
                  e.g., critical, annual-review, high-priority
                </div>
              </div>

              <div>
                <Label className={labelClass}>Notes</Label>
                <textarea
                  rows={5}
                  className={`${textareaClass} min-h-[120px]`}
                  placeholder="Add any additional notes or details about this contract"
                />
              </div>

              <div>
                <Label className={labelClass}>Departments</Label>
                <Input
                  type="text"
                  className={inputClass}
                  placeholder="e.g., Engineering, Marketing, Sales"
                />
              </div>

              <div>
                <Label className={labelClass}>Locations</Label>
                <Input
                  type="text"
                  className={inputClass}
                  placeholder="e.g., New York Office, Remote"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/contracts"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

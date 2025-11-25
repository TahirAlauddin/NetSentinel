"use client";

import { useRef, KeyboardEvent, useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { FormField } from "../FormField";
import { Vendor } from "@/types/assets";
import { listVendors, createVendor } from "@/app/(app)/assets/actions";
import { toast } from "sonner";

interface VendorFieldProps {
  label: string;
  value?: number | null; // Vendor ID
  onChange: (vendorId: number | null) => void;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  error?: string;
}

/**
 * VendorField component for selecting a vendor
 * Allows selecting from existing vendors or creating a new one
 * Features autocomplete suggestions from existing vendors
 */
export function VendorField({
  label,
  value,
  onChange,
  placeholder = "Type to search or create a vendor",
  optional,
  required,
  error,
}: VendorFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Load selected vendor when value changes
  useEffect(() => {
    if (value && vendors.length > 0) {
      const vendor = vendors.find((v) => v.id === value);
      setSelectedVendor(vendor || null);
      setInputValue(vendor?.name || "");
    } else {
      setSelectedVendor(null);
      setInputValue("");
    }
  }, [value, vendors]);

  // Filter vendors based on input
  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredVendors([]);
      return;
    }

    const filtered = vendors.filter((vendor) =>
      vendor.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [inputValue, vendors]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const vendorList = await listVendors();
      setVendors(vendorList);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setInputValue(vendor.name);
    onChange(vendor.id);
    setShowAutocomplete(false);
    inputRef.current?.blur();
  };

  const handleRemoveVendor = () => {
    setSelectedVendor(null);
    setInputValue("");
    onChange(null);
    inputRef.current?.focus();
  };

  const handleCreateVendor = async (vendorName: string) => {
    if (!vendorName.trim()) {
      return;
    }

    // Check if vendor already exists (case-insensitive)
    const existingVendor = vendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase()
    );

    if (existingVendor) {
      handleSelectVendor(existingVendor);
      return;
    }

    try {
      setLoading(true);
      const result = await createVendor({ name: vendorName.trim() });
      if (result.success && result.data) {
        // Reload vendors to get the new one
        await loadVendors();
        handleSelectVendor(result.data);
        toast.success(`Vendor "${vendorName}" created successfully`);
      } else {
        toast.error(result.error || "Failed to create vendor");
      }
    } catch (error) {
      console.error("Failed to create vendor:", error);
      toast.error("Failed to create vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredVendors.length > 0) {
        // Select first suggestion if available
        handleSelectVendor(filteredVendors[0]);
      } else if (inputValue.trim()) {
        // Create new vendor
        handleCreateVendor(inputValue);
      }
    } else if (e.key === "Escape") {
      setShowAutocomplete(false);
      inputRef.current?.blur();
    } else if (e.key === "Backspace" && inputValue === "" && selectedVendor) {
      // Remove selected vendor when backspace is pressed on empty input
      handleRemoveVendor();
    } else if (e.key === "ArrowDown" && filteredVendors.length > 0) {
      e.preventDefault();
      setShowAutocomplete(true);
    }
  };

  // Show autocomplete when there are filtered vendors
  useEffect(() => {
    setShowAutocomplete(
      filteredVendors.length > 0 && inputValue.trim().length > 0 && !selectedVendor
    );
  }, [filteredVendors, inputValue, selectedVendor]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <FormField label={label} optional={optional} required={required} error={error}>
      <div ref={containerRef} className="relative">
        <div
          className={`flex items-center gap-2 p-2 border rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          {/* Display selected vendor */}
          {selectedVendor ? (
            <>
              <span className="flex-1 text-sm font-medium text-gray-900">
                {selectedVendor.name}
              </span>
              <button
                type="button"
                onClick={handleRemoveVendor}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={`Remove ${selectedVendor.name}`}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </>
          ) : (
            <>
              {/* Input field */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowAutocomplete(true);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (filteredVendors.length > 0 && inputValue.trim().length > 0) {
                    setShowAutocomplete(true);
                  }
                }}
                placeholder={placeholder}
                className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                disabled={loading}
              />
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showAutocomplete && filteredVendors.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => handleSelectVendor(vendor)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {vendor.name}
              </button>
            ))}
          </div>
        )}

        {/* Show create option if no matches */}
        {showAutocomplete &&
          filteredVendors.length === 0 &&
          inputValue.trim().length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <button
                type="button"
                onClick={() => handleCreateVendor(inputValue)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-blue-600"
                disabled={loading}
              >
                Create "{inputValue}"
              </button>
            </div>
          )}
      </div>

      {/* Helper text */}
      {!selectedVendor && (
        <p className="text-xs text-gray-500 mt-1">
          Type to search vendors or press Enter to create a new one
        </p>
      )}
    </FormField>
  );
}


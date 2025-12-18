"use client";

import { useRef, KeyboardEvent, useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { FormField } from "../FormField";
import { Asset } from "@/types/assets";
import { listAssets } from "@/app/(app)/assets/actions";
import { toast } from "sonner";

interface RelatedItemFieldProps {
  label: string;
  value?: Asset[] | number[]; // Array of Asset objects or IDs
  onChange: (assets: Asset[]) => void;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  error?: string;
  excludeAssetId?: number; // Exclude current asset from search results
}

/**
 * RelatedItemField component for selecting related assets
 * Allows selecting multiple assets with autocomplete search
 */
export function RelatedItemField({
  label,
  value,
  onChange,
  placeholder = "Search for an item to associate",
  optional,
  required,
  error,
  excludeAssetId,
}: RelatedItemFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

  // Convert value to Asset array (handle both Asset objects and IDs)
  useEffect(() => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        setSelectedAssets([]);
        return;
      }

      // Check if value contains Asset objects or IDs
      const firstItem = value[0];
      if (typeof firstItem === "object" && firstItem !== null && "id" in firstItem) {
        // Value is already Asset objects
        setSelectedAssets(value as Asset[]);
      } else if (typeof firstItem === "number") {
        // Value is IDs, need to fetch Asset objects
        fetchAssetsByIds(value as number[]);
      }
    }
  }, [value]);

  // Load all assets
  const loadAllAssets = async () => {
    try {
      setLoading(true);
      const allAssetsList = await listAssets();
      setAllAssets(allAssetsList);
    } catch (error) {
      console.error("Failed to load assets:", error);
      toast.error("Failed to load assets");
      setAllAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Load all assets on mount
  useEffect(() => {
    loadAllAssets();
  }, []);

  // Recompute available assets when dependencies change
  useEffect(() => {
    const filtered = allAssets.filter((asset) => {
      if (excludeAssetId && asset.id === excludeAssetId) return false;
      return !selectedAssets.some((selected) => selected.id === asset.id);
    });
    setAvailableAssets(filtered);
  }, [allAssets, selectedAssets, excludeAssetId]);

  // Filter locally for autocomplete to avoid input blur / async flicker
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setFilteredAssets([]);
      setShowAutocomplete(false);
      return;
    }

    const searchTerm = inputValue.toLowerCase().trim();
    const filtered = availableAssets.filter((asset) => {
      const nameMatch = asset.name.toLowerCase().includes(searchTerm);
      const tagMatch = (asset.asset_tag ?? "").toLowerCase().includes(searchTerm);
      return nameMatch || tagMatch;
    });

    setFilteredAssets(filtered.slice(0, 20));
    setShowAutocomplete(true);
    setShowAllAssets(false);
  }, [inputValue, availableAssets]);

  // Fetch assets by IDs
  const fetchAssetsByIds = async (ids: number[]) => {
    try {
      setLoading(true);
      const allAssets = await listAssets();
      const foundAssets = allAssets.filter((asset) => ids.includes(asset.id));
      setSelectedAssets(foundAssets);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      toast.error("Failed to load related items");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (asset: Asset) => {
    // Check if asset is already selected
    if (selectedAssets.some((a) => a.id === asset.id)) {
      return;
    }

    const newSelectedAssets = [...selectedAssets, asset];
    setSelectedAssets(newSelectedAssets);
    onChange(newSelectedAssets);
    setInputValue("");
    setShowAutocomplete(false);
    setShowAllAssets(false);
    setFilteredAssets([]);
    inputRef.current?.focus();
  };

  const handleChevronClick = async () => {
    if (allAssets.length === 0) {
      await loadAllAssets();
    }

    setShowAllAssets((prev) => {
      const next = !prev;
      if (next) {
        setShowAutocomplete(false);
      }
      return next;
    });
    inputRef.current?.focus();
  };

  const handleRemoveAsset = (assetId: number) => {
    const newSelectedAssets = selectedAssets.filter((a) => a.id !== assetId);
    setSelectedAssets(newSelectedAssets);
    onChange(newSelectedAssets);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredAssets.length > 0) {
        // Select first suggestion if available
        handleSelectAsset(filteredAssets[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowAutocomplete(false);
      setShowAllAssets(false);
    } else if (e.key === "ArrowDown" && filteredAssets.length > 0) {
      e.preventDefault();
      setShowAutocomplete(true);
    }
  };

  // Show autocomplete when there are filtered assets
  useEffect(() => {
    setShowAutocomplete(
      filteredAssets.length > 0 && inputValue.trim().length > 0 && !showAllAssets
    );
  }, [filteredAssets, inputValue, showAllAssets]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
        setShowAllAssets(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <FormField label={label} optional={optional} required={required} error={error}>
      <div ref={containerRef} className="space-y-2">
        {/* Search input */}
        <div className="relative">
          <div
            className={`flex items-center gap-2 p-2 border rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowAllAssets(false);
              }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                e.stopPropagation();
                if (filteredAssets.length > 0 && inputValue.trim().length > 0) {
                  setShowAutocomplete(true);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              placeholder={placeholder}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
              disabled={loading}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleChevronClick();
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              aria-label="Show all assets"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showAllAssets ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {showAutocomplete && filteredAssets.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectAsset(asset);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                >
                  <div className="font-medium text-gray-900">{asset.name}</div>
                  {asset.asset_tag && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Tag: {asset.asset_tag}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* All assets dropdown */}
          {showAllAssets && availableAssets.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {availableAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectAsset(asset);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                >
                  <div className="font-medium text-gray-900">{asset.name}</div>
                  {asset.asset_tag && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Tag: {asset.asset_tag}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected assets list */}
        {selectedAssets.length > 0 && (
          <div className="space-y-2">
            {selectedAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 block truncate">
                    {asset.name}
                  </span>
                  {asset.asset_tag && (
                    <span className="text-xs text-gray-500 mt-0.5 block">
                      {asset.asset_tag}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAsset(asset.id)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors ml-2 flex-shrink-0"
                  aria-label={`Remove ${asset.name}`}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Helper text */}
        {selectedAssets.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Type to search for assets to associate
          </p>
        )}
      </div>
    </FormField>
  );
}


"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DHCPOption } from "@/types/ipam";
import {
  getAllOptions,
  getEssentialOptions,
  type DHCPOptionDefinition,
} from "@/constants/dhcp-options";

interface DhcpOptionsFormProps {
  scopeId: number;
  options?: DHCPOption[];
  onChange: (options: Partial<DHCPOption>[]) => void;
}

interface OptionValue {
  option_code: number;
  value: string;
  description?: string;
}

export function DhcpOptionsForm({
  scopeId,
  options = [],
  onChange,
}: DhcpOptionsFormProps) {
  // For new scopes (scopeId = 0), we'll use a placeholder in the option data
  const isNewScope = scopeId === 0;
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [optionValues, setOptionValues] = useState<Map<number, OptionValue>>(
    new Map()
  );

  // Initialize from existing options - only when options prop first loads or has new items
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Only initialize once on mount, or when we get new options from backend
    if (!isInitialized && options.length > 0) {
      const values = new Map<number, OptionValue>();
      const selected = new Set<number>();
      
      options.forEach((opt) => {
        values.set(opt.option_code, {
          option_code: opt.option_code,
          value: opt.value,
          description: opt.description || undefined,
        });
        selected.add(opt.option_code);
      });
      
      setOptionValues(values);
      setSelectedOptions(selected);
      setIsInitialized(true);
    }
  }, [options, isInitialized]);

  // Get available options based on mode
  const availableOptions = useMemo(() => {
    return mode === "simple" ? getEssentialOptions() : getAllOptions();
  }, [mode]);

  // Sort options by code
  const sortedOptions = useMemo(() => {
    return Object.values(availableOptions).sort((a, b) => a.code - b.code);
  }, [availableOptions]);

  const toggleOptionSelection = (code: number) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(code)) {
      newSelected.delete(code);
      // Remove value when deselecting
      const newValues = new Map(optionValues);
      newValues.delete(code);
      setOptionValues(newValues);
      notifyChange(newValues);
    } else {
      newSelected.add(code);
    }
    setSelectedOptions(newSelected);
  };

  const updateOptionValue = (code: number, value: string, description?: string) => {
    const newValues = new Map(optionValues);
    // Always keep the value in the map, even if empty, so the input doesn't disappear
    newValues.set(code, {
      option_code: code,
      value: value, // Store the raw value, don't trim
      description: description?.trim() || undefined,
    });
    setOptionValues(newValues);
    // Only notify parent of non-empty values
    const valuesToNotify = new Map(newValues);
    Array.from(valuesToNotify.entries()).forEach(([k, v]) => {
      if (!v.value.trim()) {
        valuesToNotify.delete(k);
      }
    });
    notifyChange(valuesToNotify);
  };

  const notifyChange = (values: Map<number, OptionValue>) => {
    const optionsArray: Partial<DHCPOption>[] = Array.from(values.values()).map(
      (opt) => ({
        scope: isNewScope ? undefined : scopeId,
        option_code: opt.option_code,
        value: opt.value,
        description: opt.description,
      })
    );
    onChange(optionsArray);
  };

  const renderOptionInput = (
    optionDef: DHCPOptionDefinition,
    currentValue?: OptionValue
  ) => {
    const { code, name, type, format } = optionDef;
    const value = currentValue?.value || "";

    if (type === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`option-value-${code}`}
            checked={value === "true" || value === "1"}
            onCheckedChange={(checked) =>
              updateOptionValue(code, checked ? "true" : "", currentValue?.description)
            }
          />
          <Label htmlFor={`option-value-${code}`} className="cursor-pointer">
            Enable {name}
          </Label>
        </div>
      );
    }

    if (format === "multiple" && type === "ip_address") {
      return (
        <div className="space-y-2">
          <Input
            id={`option-value-${code}`}
            value={value}
            onChange={(e) =>
              updateOptionValue(code, e.target.value, currentValue?.description)
            }
            placeholder="192.168.1.1, 192.168.1.2"
          />
          <p className="text-xs text-muted-foreground">
            Enter multiple IP addresses separated by commas
          </p>
        </div>
      );
    }

    if (type === "ip_address") {
      return (
        <Input
          id={`option-value-${code}`}
          type="text"
          value={value}
          onChange={(e) =>
            updateOptionValue(code, e.target.value, currentValue?.description)
          }
          placeholder="192.168.1.1"
        />
      );
    }

    if (type === "integer") {
      return (
        <Input
          id={`option-value-${code}`}
          type="number"
          value={value}
          onChange={(e) =>
            updateOptionValue(code, e.target.value, currentValue?.description)
          }
          placeholder="Enter number"
        />
      );
    }

    // String type
    return (
      <Input
        id={`option-value-${code}`}
        type="text"
        value={value}
        onChange={(e) =>
          updateOptionValue(code, e.target.value, currentValue?.description)
        }
        placeholder={`Enter ${name.toLowerCase()}`}
      />
    );
  };

  const renderSelectedOption = (optionDef: DHCPOptionDefinition) => {
    const currentValue = optionValues.get(optionDef.code);
    const hasValue = currentValue !== undefined;

    return (
      <div
        key={optionDef.code}
        className={`space-y-3 p-4 border rounded-lg ${
          hasValue ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor={`option-value-${optionDef.code}`} className="font-semibold">
                Option {optionDef.code}: {optionDef.name}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {optionDef.description}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleOptionSelection(optionDef.code)}
            className="ml-2"
          >
            Remove
          </Button>
        </div>
        <div className="mt-2">{renderOptionInput(optionDef, currentValue)}</div>
        {mode === "advanced" && (
          <div className="mt-2">
            <Label htmlFor={`option-${optionDef.code}-desc`} className="text-xs">
              Description (optional)
            </Label>
            <Input
              id={`option-${optionDef.code}-desc`}
              type="text"
              value={currentValue?.description || ""}
              onChange={(e) =>
                updateOptionValue(
                  optionDef.code,
                  currentValue?.value || "",
                  e.target.value
                )
              }
              placeholder="Optional description for this option"
              className="mt-1"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">DHCP Options</h3>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "simple" | "advanced")}>
            <TabsList>
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <p className="text-sm text-muted-foreground">
          {mode === "simple"
            ? "Select options to configure from the most commonly used DHCP options."
            : "Select options to configure from all available DHCP options."}
        </p>

        {/* Option Selection Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Select Options to Configure ({selectedOptions.size} selected)
          </Label>
          <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {sortedOptions.map((optionDef) => (
                <div key={optionDef.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-select-${optionDef.code}`}
                    checked={selectedOptions.has(optionDef.code)}
                    onCheckedChange={() => toggleOptionSelection(optionDef.code)}
                  />
                  <Label
                    htmlFor={`option-select-${optionDef.code}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <span className="font-medium">Option {optionDef.code}:</span>{" "}
                    {optionDef.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Options Configuration Section */}
        {selectedOptions.size > 0 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Configure Selected Options ({selectedOptions.size})
            </Label>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sortedOptions
                .filter((opt) => selectedOptions.has(opt.code))
                .map((optionDef) => renderSelectedOption(optionDef))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {optionValues.size} option{optionValues.size !== 1 ? "s" : ""} configured
            {selectedOptions.size > optionValues.size && (
              <span className="text-amber-600 ml-2">
                ({selectedOptions.size - optionValues.size} selected but not yet configured)
              </span>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

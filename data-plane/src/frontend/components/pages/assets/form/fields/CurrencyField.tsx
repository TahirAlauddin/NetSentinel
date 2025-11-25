"use client"

import { Input } from "@/components/ui/input"
import { FormField } from "../FormField"

interface CurrencyFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  optional?: boolean
  className?: string
  error?: string
}

/**
 * Reusable currency input field
 */
export function CurrencyField({
  label,
  value,
  onChange,
  optional,
  className = "",
  error,
}: CurrencyFieldProps) {
  return (
    <FormField label={label} optional={optional} className={className} error={error}>
      <div className="relative">
        <span className="absolute left-3 top-3 text-gray-500">$</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-7 border rounded-lg ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="0"
        />
      </div>
    </FormField>
  )
}


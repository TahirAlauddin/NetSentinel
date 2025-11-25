"use client"

import { FormField } from "../FormField"

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  optional?: boolean
  className?: string
  required?: boolean
  size?: number
  error?: string
}

/**
 * Reusable select field component
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  optional,
  required,
  size = 1,
  className = "",
  error,
}: SelectFieldProps) {
  return (
    <FormField label={label} optional={optional} required={required} className={className} error={error}>
      <div className="relative">
        <select
          size={size}
          required={required ?? false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 text-sm appearance-none pr-10 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </FormField>
  )
}

